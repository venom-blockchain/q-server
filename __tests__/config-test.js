import { QTracer } from '../server/tracer';

test("Jaeger Config", () => {
    expect(QTracer.getJaegerConfig({
        endpoint: '',
        service: '',
        tags: [],
    })).toBeNull();

    expect(QTracer.getJaegerConfig({
        endpoint: 'http://collector:1234',
        service: 'service',
        tags: [],
    })).toEqual({
        serviceName: 'service',
        sampler: {
            type: 'const',
            param: 1,
        },
        reporter: {
            collectorEndpoint: 'http://collector:1234',
            logSpans: true,
        },
    });

    expect(QTracer.getJaegerConfig({
        endpoint: 'agent:1234',
        service: 'service',
        tags: [],
    })).toEqual({
        serviceName: 'service',
        sampler: {
            type: 'const',
            param: 1,
        },
        reporter: {
            agentHost: 'agent',
            agentPort: 1234,
            logSpans: true,
        },
    });
});
