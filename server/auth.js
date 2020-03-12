// @flow

import type { QConfig } from "./config";
import fetch from 'node-fetch';
import { createError } from "./utils";

export type AccessKey = {
    key: string,
    restrictToAccounts?: string[],
}

export type AccessRights = {
    granted: bool,
    restrictToAccounts: string[],
}

const grantedAccess: AccessRights = Object.freeze({
    granted: true,
    restrictToAccounts: [],
});

const deniedAccess: AccessRights = Object.freeze({
    granted: false,
    restrictToAccounts: [],
});

export class Auth {
    config: QConfig;

    constructor(config: QConfig) {
        this.config = config;
    }

    static extractAccessKey(req: any, connection: any): string {
        return (req && req.headers && (req.headers.accessKey || req.headers.accesskey))
            || (connection && connection.context && connection.context.accessKey);
    }

    static unauthorizedError(): Error {
        return createError(401, 'Unauthorized');
    }

    authServiceRequired() {
        if (!this.config.authorization.endpoint) {
            throw createError(500, 'Auth service unavailable');
        }
    }

    async requireGrantedAccess(accessKey: string | typeof undefined): Promise<AccessRights> {
        const access = await this.getAccessRights(accessKey);
        if (!access.granted) {
            throw Auth.unauthorizedError();
        }
        return access;
    }

    async getAccessRights(accessKey: string | typeof undefined): Promise<AccessRights> {
        if (!this.config.authorization.endpoint) {
            return grantedAccess;
        }
        if ((accessKey || '') === '') {
            return deniedAccess;
        }
        const rights = await this.invokeAuth('getAccessRights', {
            accessKey,
        });
        if (!rights.restrictToAccounts) {
            rights.restrictToAccounts = [];
        }
        return rights;
    }

    async getManagementAccessKey(): Promise<string> {
        this.authServiceRequired();
        return this.invokeAuth('getManagementAccessKey', {});
    }

    async registerAccessKeys(
        account: string,
        keys: AccessKey[],
        signedManagementAccessKey: string
    ): Promise<number> {
        this.authServiceRequired();
        return this.invokeAuth('registerAccessKeys', {
            account,
            keys,
            signedManagementAccessKey
        });
    }

    async revokeAccessKeys(
        account: string,
        keys: string[],
        signedManagementAccessKey: string
    ): Promise<number> {
        this.authServiceRequired();
        return this.invokeAuth('revokeAccessKeys', {
            account,
            keys,
            signedManagementAccessKey
        });
    }

    async invokeAuth(method: string, params: any): Promise<any> {
        const res = await fetch(this.config.authorization.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: '1',
                method,
                params
            }),
        });

        if (res.status !== 200) {
            throw new Error(`Auth service failed: ${await res.text()}`);
        }

        const response = await res.json();
        if (response.error) {
            const error = new Error(response.error.message || response.error.description);
            (error: any).source = response.error.source || 'graphql';
            (error: any).code = response.error.code || 500;
            throw error;
        }

        return response.result;
    }

}
