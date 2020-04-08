// @flow

import {STATS} from './config';
import type {QConfig} from "./config";
import {tracer as noopTracer} from "opentracing/lib/noop";
import StatsD from 'node-statsd';
import {Tracer, Tags, FORMAT_TEXT_MAP, FORMAT_BINARY, Span, SpanContext} from "opentracing";

import {initTracerFromEnv as initJaegerTracer} from 'jaeger-client';
import {cleanError, toLog} from "./utils";

export interface IStats {
    increment(stat: string, value?: number, sampleRate?: number | string[], tags?: string[]): void,

    decrement(stat: string, value?: number, sampleRate?: number | string[], tags?: string[]): void,

    histogram(stat: string, value: number, sampleRate?: number | string[], tags?: string[]): void,

    gauge(stat: string, value: number, sampleRate?: number | string[], tags?: string[]): void,

    set(stat: string, value: number, sampleRate?: number | string[], tags?: string[]): void,

    timing(stat: string, value: number, sampleRate?: number | string[], tags?: string[]): void,
}

function dummy(stat: string, value?: number, sampleRate?: number | string[], tags?: string[]) {
}

const dummyStats: IStats = {
    increment: dummy,
    decrement: dummy,
    histogram: dummy,
    gauge: dummy,
    set: dummy,
    timing: dummy,
};

export class QStats {
    static create(server: string): IStats {
        if (!server) {
            return dummyStats;
        }
        const hostPort = server.split(':');
        return new StatsD(hostPort[0], hostPort[1], STATS.prefix);
    }
}

export class StatsCounter {
    stats: IStats;
    name: string;
    tags: string[];

    constructor(stats: IStats, name: string, tags: string[]) {
        this.stats = stats;
        this.name = name;
        this.tags = tags;
    }

    increment() {
        this.stats.increment(this.name, 1, this.tags);
    }
}

export class StatsGauge {
    stats: IStats;
    name: string;
    tags: string[];
    value: number;

    constructor(stats: IStats, name: string, tags: string[]) {
        this.stats = stats;
        this.name = name;
        this.tags = tags;
        this.value = 0;
    }

    set(value: number) {
        this.value = value;
        this.stats.gauge(this.name, this.value, this.tags);
    }

    increment(delta: number = 1) {
        this.set(this.value + delta);
    }

    decrement(delta: number = 1) {
        this.set(this.value - delta);
    }
}

export class StatsTiming {
    stats: IStats;
    name: string;
    tags: string[];

    constructor(stats: IStats, name: string, tags: string[]) {
        this.stats = stats;
        this.name = name;
        this.tags = tags;
    }

    report(value: number) {
        this.stats.timing(this.name, value, this.tags);
    }

    start(): () => void {
        const start = Date.now();
        return () => {
            this.report(Date.now() - start);
        }
    }
}

export class QTracer {
    static config: QConfig;

    static create(config: QConfig): Tracer {
        QTracer.config = config;
        const endpoint = config.jaeger.endpoint;
        if (!endpoint) {
            return noopTracer;
        }
        return initJaegerTracer({
            serviceName: config.jaeger.service,
            sampler: {
                type: 'const',
                param: 1,
            },
            reporter: {
                collectorEndpoint: endpoint,
                logSpans: true,
            },
        }, {
            logger: {
                info(msg) {
                    console.log('INFO ', msg);
                },
                error(msg) {
                    console.log('ERROR', msg);
                },
            },
        });
    }

    static extractParentSpan(tracer: Tracer, req: any): any {
        let ctx_src,
            ctx_frm;
        if (req.headers) {
            ctx_src = req.headers;
            ctx_frm = FORMAT_TEXT_MAP;
        } else {
            ctx_src = req.context;
            ctx_frm = FORMAT_BINARY;
        }
        return tracer.extract(ctx_frm, ctx_src);
    }

    static getParentSpan(tracer: Tracer, context: any): (SpanContext | typeof undefined) {
        return context.tracerParentSpan;
    }

    static failed(tracer: Tracer, span: Span, error: any) {
        span.log({
            event: 'failed',
            payload: toLog(error),
        });
    }

    static async trace<T>(
        tracer: Tracer,
        name: string,
        f: (span: Span) => Promise<T>,
        parentSpan?: (Span | SpanContext),
    ): Promise<T> {
        const span = tracer.startSpan(name, {childOf: parentSpan});
        try {
            span.setTag(Tags.SPAN_KIND, 'server');
            Object.entries(QTracer.config.jaeger.tags).forEach(([name, value]) => {
                if (name) {
                    span.setTag(name, value);
                }
            });
            const result = await f(span);
            if (result !== undefined) {
                span.setTag('result', toLog(result));
            }
            span.finish();
            return result;
        } catch (error) {
            const cleaned = cleanError(error);
            QTracer.failed(tracer, span, cleaned);
            span.finish();
            throw cleaned;
        }
    }
}
