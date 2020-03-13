"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _express = _interopRequireDefault(require("express"));

var _http = _interopRequireDefault(require("http"));

var _apolloServerExpress = require("apollo-server-express");

var _subscriptionsTransportWs = require("subscriptions-transport-ws");

var _tonClientNodeJs = require("ton-client-node-js");

var _arango = _interopRequireDefault(require("./arango"));

var _resolversGenerated = require("./resolvers-generated");

var _resolversCustom = require("./resolvers-custom");

var _resolversMam = require("./resolvers-mam");

var _logs = _interopRequireDefault(require("./logs"));

var _tracer = require("./tracer");

var _opentracing = require("opentracing");

var _auth = require("./auth");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */
class TONQServer {
  constructor(options) {
    this.config = options.config;
    this.logs = options.logs;
    this.log = this.logs.create('server');
    this.shared = new Map();
    this.tracer = _tracer.QTracer.create(options.config);
    this.auth = new _auth.Auth(options.config);
    this.endPoints = [];
    this.app = (0, _express.default)();
    this.server = _http.default.createServer(this.app);
    this.db = new _arango.default(this.config, this.logs, this.auth, this.tracer);
    this.addEndPoint({
      path: '/graphql/mam',
      resolvers: _resolversMam.resolversMam,
      typeDefFileNames: ['type-defs-mam.graphql'],
      supportSubscriptions: false
    });
    this.addEndPoint({
      path: '/graphql',
      resolvers: (0, _resolversCustom.attachCustomResolvers)((0, _resolversGenerated.createResolvers)(this.db)),
      typeDefFileNames: ['type-defs-generated.graphql', 'type-defs-custom.graphql'],
      supportSubscriptions: true
    });
  }

  async start() {
    this.client = await _tonClientNodeJs.TONClient.create({
      servers: ['']
    });
    await this.db.start();
    const {
      host,
      port
    } = this.config.server;
    this.server.listen({
      host,
      port
    }, () => {
      this.endPoints.forEach(endPoint => {
        this.log.debug('GRAPHQL', `http://${host}:${port}${endPoint.path}`);
      });
    });
  }

  addEndPoint(endPoint) {
    const typeDefs = endPoint.typeDefFileNames.map(x => _fs.default.readFileSync(x, 'utf-8')).join('\n');
    const config = {
      typeDefs,
      resolvers: endPoint.resolvers,
      subscriptions: {
        onConnect(connectionParams, _websocket, _context) {
          return {
            accessKey: connectionParams.accessKey || connectionParams.accesskey
          };
        }

      },
      context: ({
        req,
        connection
      }) => {
        return {
          db: this.db,
          tracer: this.tracer,
          auth: this.auth,
          client: this.client,
          config: this.config,
          shared: this.shared,
          remoteAddress: req && req.socket && req.socket.remoteAddress || '',
          accessKey: _auth.Auth.extractAccessKey(req, connection),
          parentSpan: _tracer.QTracer.extractParentSpan(this.tracer, connection ? connection : req)
        };
      },
      plugins: [{
        requestDidStart(_requestContext) {
          return {
            willSendResponse(ctx) {
              const context = ctx.context;

              if (context.multipleAccessKeysDetected) {
                throw (0, _utils.createError)(400, 'Request must use the same access key for all queries and mutations');
              }
            }

          };
        }

      }]
    };
    const apollo = new _apolloServerExpress.ApolloServer(config);
    apollo.applyMiddleware({
      app: this.app,
      path: endPoint.path
    });

    if (endPoint.supportSubscriptions) {
      apollo.installSubscriptionHandlers(this.server);
    }

    this.endPoints.push(endPoint);
  }

}

exports.default = TONQServer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiVE9OUVNlcnZlciIsImNvbnN0cnVjdG9yIiwib3B0aW9ucyIsImNvbmZpZyIsImxvZ3MiLCJsb2ciLCJjcmVhdGUiLCJzaGFyZWQiLCJNYXAiLCJ0cmFjZXIiLCJRVHJhY2VyIiwiYXV0aCIsIkF1dGgiLCJlbmRQb2ludHMiLCJhcHAiLCJzZXJ2ZXIiLCJodHRwIiwiY3JlYXRlU2VydmVyIiwiZGIiLCJBcmFuZ28iLCJhZGRFbmRQb2ludCIsInBhdGgiLCJyZXNvbHZlcnMiLCJyZXNvbHZlcnNNYW0iLCJ0eXBlRGVmRmlsZU5hbWVzIiwic3VwcG9ydFN1YnNjcmlwdGlvbnMiLCJzdGFydCIsImNsaWVudCIsIlRPTkNsaWVudE5vZGVKcyIsInNlcnZlcnMiLCJob3N0IiwicG9ydCIsImxpc3RlbiIsImZvckVhY2giLCJlbmRQb2ludCIsImRlYnVnIiwidHlwZURlZnMiLCJtYXAiLCJ4IiwiZnMiLCJyZWFkRmlsZVN5bmMiLCJqb2luIiwic3Vic2NyaXB0aW9ucyIsIm9uQ29ubmVjdCIsImNvbm5lY3Rpb25QYXJhbXMiLCJfd2Vic29ja2V0IiwiX2NvbnRleHQiLCJhY2Nlc3NLZXkiLCJhY2Nlc3NrZXkiLCJjb250ZXh0IiwicmVxIiwiY29ubmVjdGlvbiIsInJlbW90ZUFkZHJlc3MiLCJzb2NrZXQiLCJleHRyYWN0QWNjZXNzS2V5IiwicGFyZW50U3BhbiIsImV4dHJhY3RQYXJlbnRTcGFuIiwicGx1Z2lucyIsInJlcXVlc3REaWRTdGFydCIsIl9yZXF1ZXN0Q29udGV4dCIsIndpbGxTZW5kUmVzcG9uc2UiLCJjdHgiLCJtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCIsImFwb2xsbyIsIkFwb2xsb1NlcnZlciIsImFwcGx5TWlkZGxld2FyZSIsImluc3RhbGxTdWJzY3JpcHRpb25IYW5kbGVycyIsInB1c2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBR0E7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUF0Q0E7Ozs7Ozs7Ozs7Ozs7OztBQW9EZSxNQUFNQSxVQUFOLENBQWlCO0FBYzVCQyxFQUFBQSxXQUFXLENBQUNDLE9BQUQsRUFBb0I7QUFDM0IsU0FBS0MsTUFBTCxHQUFjRCxPQUFPLENBQUNDLE1BQXRCO0FBQ0EsU0FBS0MsSUFBTCxHQUFZRixPQUFPLENBQUNFLElBQXBCO0FBQ0EsU0FBS0MsR0FBTCxHQUFXLEtBQUtELElBQUwsQ0FBVUUsTUFBVixDQUFpQixRQUFqQixDQUFYO0FBQ0EsU0FBS0MsTUFBTCxHQUFjLElBQUlDLEdBQUosRUFBZDtBQUNBLFNBQUtDLE1BQUwsR0FBY0MsZ0JBQVFKLE1BQVIsQ0FBZUosT0FBTyxDQUFDQyxNQUF2QixDQUFkO0FBQ0EsU0FBS1EsSUFBTCxHQUFZLElBQUlDLFVBQUosQ0FBU1YsT0FBTyxDQUFDQyxNQUFqQixDQUFaO0FBQ0EsU0FBS1UsU0FBTCxHQUFpQixFQUFqQjtBQUNBLFNBQUtDLEdBQUwsR0FBVyx1QkFBWDtBQUNBLFNBQUtDLE1BQUwsR0FBY0MsY0FBS0MsWUFBTCxDQUFrQixLQUFLSCxHQUF2QixDQUFkO0FBQ0EsU0FBS0ksRUFBTCxHQUFVLElBQUlDLGVBQUosQ0FBVyxLQUFLaEIsTUFBaEIsRUFBd0IsS0FBS0MsSUFBN0IsRUFBbUMsS0FBS08sSUFBeEMsRUFBOEMsS0FBS0YsTUFBbkQsQ0FBVjtBQUNBLFNBQUtXLFdBQUwsQ0FBaUI7QUFDYkMsTUFBQUEsSUFBSSxFQUFFLGNBRE87QUFFYkMsTUFBQUEsU0FBUyxFQUFFQywwQkFGRTtBQUdiQyxNQUFBQSxnQkFBZ0IsRUFBRSxDQUFDLHVCQUFELENBSEw7QUFJYkMsTUFBQUEsb0JBQW9CLEVBQUU7QUFKVCxLQUFqQjtBQU1BLFNBQUtMLFdBQUwsQ0FBaUI7QUFDYkMsTUFBQUEsSUFBSSxFQUFFLFVBRE87QUFFYkMsTUFBQUEsU0FBUyxFQUFFLDRDQUFzQix5Q0FBZ0IsS0FBS0osRUFBckIsQ0FBdEIsQ0FGRTtBQUdiTSxNQUFBQSxnQkFBZ0IsRUFBRSxDQUFDLDZCQUFELEVBQWdDLDBCQUFoQyxDQUhMO0FBSWJDLE1BQUFBLG9CQUFvQixFQUFFO0FBSlQsS0FBakI7QUFNSDs7QUFHRCxRQUFNQyxLQUFOLEdBQWM7QUFDVixTQUFLQyxNQUFMLEdBQWMsTUFBTUMsMkJBQWdCdEIsTUFBaEIsQ0FBdUI7QUFBRXVCLE1BQUFBLE9BQU8sRUFBRSxDQUFDLEVBQUQ7QUFBWCxLQUF2QixDQUFwQjtBQUNBLFVBQU0sS0FBS1gsRUFBTCxDQUFRUSxLQUFSLEVBQU47QUFDQSxVQUFNO0FBQUVJLE1BQUFBLElBQUY7QUFBUUMsTUFBQUE7QUFBUixRQUFpQixLQUFLNUIsTUFBTCxDQUFZWSxNQUFuQztBQUNBLFNBQUtBLE1BQUwsQ0FBWWlCLE1BQVosQ0FBbUI7QUFBRUYsTUFBQUEsSUFBRjtBQUFRQyxNQUFBQTtBQUFSLEtBQW5CLEVBQW1DLE1BQU07QUFDckMsV0FBS2xCLFNBQUwsQ0FBZW9CLE9BQWYsQ0FBd0JDLFFBQUQsSUFBd0I7QUFDM0MsYUFBSzdCLEdBQUwsQ0FBUzhCLEtBQVQsQ0FBZSxTQUFmLEVBQTJCLFVBQVNMLElBQUssSUFBR0MsSUFBSyxHQUFFRyxRQUFRLENBQUNiLElBQUssRUFBakU7QUFDSCxPQUZEO0FBR0gsS0FKRDtBQUtIOztBQUdERCxFQUFBQSxXQUFXLENBQUNjLFFBQUQsRUFBcUI7QUFDNUIsVUFBTUUsUUFBUSxHQUFHRixRQUFRLENBQUNWLGdCQUFULENBQ1phLEdBRFksQ0FDUkMsQ0FBQyxJQUFJQyxZQUFHQyxZQUFILENBQWdCRixDQUFoQixFQUFtQixPQUFuQixDQURHLEVBRVpHLElBRlksQ0FFUCxJQUZPLENBQWpCO0FBR0EsVUFBTXRDLE1BQWlDLEdBQUc7QUFDdENpQyxNQUFBQSxRQURzQztBQUV0Q2QsTUFBQUEsU0FBUyxFQUFFWSxRQUFRLENBQUNaLFNBRmtCO0FBR3RDb0IsTUFBQUEsYUFBYSxFQUFFO0FBQ1hDLFFBQUFBLFNBQVMsQ0FBQ0MsZ0JBQUQsRUFBMkJDLFVBQTNCLEVBQWtEQyxRQUFsRCxFQUFvRjtBQUN6RixpQkFBTztBQUNIQyxZQUFBQSxTQUFTLEVBQUVILGdCQUFnQixDQUFDRyxTQUFqQixJQUE4QkgsZ0JBQWdCLENBQUNJO0FBRHZELFdBQVA7QUFHSDs7QUFMVSxPQUh1QjtBQVV0Q0MsTUFBQUEsT0FBTyxFQUFFLENBQUM7QUFBRUMsUUFBQUEsR0FBRjtBQUFPQyxRQUFBQTtBQUFQLE9BQUQsS0FBeUI7QUFDOUIsZUFBTztBQUNIakMsVUFBQUEsRUFBRSxFQUFFLEtBQUtBLEVBRE47QUFFSFQsVUFBQUEsTUFBTSxFQUFFLEtBQUtBLE1BRlY7QUFHSEUsVUFBQUEsSUFBSSxFQUFFLEtBQUtBLElBSFI7QUFJSGdCLFVBQUFBLE1BQU0sRUFBRSxLQUFLQSxNQUpWO0FBS0h4QixVQUFBQSxNQUFNLEVBQUUsS0FBS0EsTUFMVjtBQU1ISSxVQUFBQSxNQUFNLEVBQUUsS0FBS0EsTUFOVjtBQU9INkMsVUFBQUEsYUFBYSxFQUFHRixHQUFHLElBQUlBLEdBQUcsQ0FBQ0csTUFBWCxJQUFxQkgsR0FBRyxDQUFDRyxNQUFKLENBQVdELGFBQWpDLElBQW1ELEVBUC9EO0FBUUhMLFVBQUFBLFNBQVMsRUFBRW5DLFdBQUswQyxnQkFBTCxDQUFzQkosR0FBdEIsRUFBMkJDLFVBQTNCLENBUlI7QUFTSEksVUFBQUEsVUFBVSxFQUFFN0MsZ0JBQVE4QyxpQkFBUixDQUEwQixLQUFLL0MsTUFBL0IsRUFBdUMwQyxVQUFVLEdBQUdBLFVBQUgsR0FBZ0JELEdBQWpFO0FBVFQsU0FBUDtBQVdILE9BdEJxQztBQXVCdENPLE1BQUFBLE9BQU8sRUFBRSxDQUNMO0FBQ0lDLFFBQUFBLGVBQWUsQ0FBQ0MsZUFBRCxFQUFrQjtBQUM3QixpQkFBTztBQUNIQyxZQUFBQSxnQkFBZ0IsQ0FBQ0MsR0FBRCxFQUFNO0FBQ2xCLG9CQUFNWixPQUE4QixHQUFHWSxHQUFHLENBQUNaLE9BQTNDOztBQUNBLGtCQUFJQSxPQUFPLENBQUNhLDBCQUFaLEVBQXdDO0FBQ3BDLHNCQUFNLHdCQUNGLEdBREUsRUFFRixvRUFGRSxDQUFOO0FBSUg7QUFDSjs7QUFURSxXQUFQO0FBV0g7O0FBYkwsT0FESztBQXZCNkIsS0FBMUM7QUF5Q0EsVUFBTUMsTUFBTSxHQUFHLElBQUlDLGlDQUFKLENBQWlCN0QsTUFBakIsQ0FBZjtBQUNBNEQsSUFBQUEsTUFBTSxDQUFDRSxlQUFQLENBQXVCO0FBQUVuRCxNQUFBQSxHQUFHLEVBQUUsS0FBS0EsR0FBWjtBQUFpQk8sTUFBQUEsSUFBSSxFQUFFYSxRQUFRLENBQUNiO0FBQWhDLEtBQXZCOztBQUNBLFFBQUlhLFFBQVEsQ0FBQ1Qsb0JBQWIsRUFBbUM7QUFDL0JzQyxNQUFBQSxNQUFNLENBQUNHLDJCQUFQLENBQW1DLEtBQUtuRCxNQUF4QztBQUNIOztBQUNELFNBQUtGLFNBQUwsQ0FBZXNELElBQWYsQ0FBb0JqQyxRQUFwQjtBQUNIOztBQXZHMkIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcblxuaW1wb3J0IHsgQXBvbGxvU2VydmVyLCBBcG9sbG9TZXJ2ZXJFeHByZXNzQ29uZmlnIH0gZnJvbSAnYXBvbGxvLXNlcnZlci1leHByZXNzJztcbmltcG9ydCB7IENvbm5lY3Rpb25Db250ZXh0IH0gZnJvbSAnc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MnO1xuaW1wb3J0IHR5cGUgeyBUT05DbGllbnQgfSBmcm9tIFwidG9uLWNsaWVudC1qcy90eXBlc1wiO1xuaW1wb3J0IHsgVE9OQ2xpZW50IGFzIFRPTkNsaWVudE5vZGVKcyB9IGZyb20gJ3Rvbi1jbGllbnQtbm9kZS1qcyc7XG5pbXBvcnQgQXJhbmdvIGZyb20gJy4vYXJhbmdvJztcbmltcG9ydCB0eXBlIHsgR3JhcGhRTFJlcXVlc3RDb250ZXh0IH0gZnJvbSBcIi4vYXJhbmdvLWNvbGxlY3Rpb25cIjtcblxuaW1wb3J0IHsgY3JlYXRlUmVzb2x2ZXJzIH0gZnJvbSAnLi9yZXNvbHZlcnMtZ2VuZXJhdGVkJztcbmltcG9ydCB7IGF0dGFjaEN1c3RvbVJlc29sdmVycyB9IGZyb20gXCIuL3Jlc29sdmVycy1jdXN0b21cIjtcbmltcG9ydCB7IHJlc29sdmVyc01hbSB9IGZyb20gXCIuL3Jlc29sdmVycy1tYW1cIjtcblxuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncyc7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHsgUVRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuaW1wb3J0IHsgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSAnLi9hdXRoJztcbmltcG9ydCB7IGNyZWF0ZUVycm9yIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxudHlwZSBRT3B0aW9ucyA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgbG9nczogUUxvZ3MsXG59XG5cbnR5cGUgRW5kUG9pbnQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHJlc29sdmVyczogYW55LFxuICAgIHR5cGVEZWZGaWxlTmFtZXM6IHN0cmluZ1tdLFxuICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiBib29sZWFuLFxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUT05RU2VydmVyIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nczogUUxvZ3M7XG4gICAgbG9nOiBRTG9nO1xuICAgIGFwcDogZXhwcmVzcy5BcHBsaWNhdGlvbjtcbiAgICBzZXJ2ZXI6IGFueTtcbiAgICBlbmRQb2ludHM6IEVuZFBvaW50W107XG4gICAgZGI6IEFyYW5nbztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBjbGllbnQ6IFRPTkNsaWVudDtcbiAgICBhdXRoOiBBdXRoO1xuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55PjtcblxuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUU9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgICAgdGhpcy5sb2dzID0gb3B0aW9ucy5sb2dzO1xuICAgICAgICB0aGlzLmxvZyA9IHRoaXMubG9ncy5jcmVhdGUoJ3NlcnZlcicpO1xuICAgICAgICB0aGlzLnNoYXJlZCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy50cmFjZXIgPSBRVHJhY2VyLmNyZWF0ZShvcHRpb25zLmNvbmZpZyk7XG4gICAgICAgIHRoaXMuYXV0aCA9IG5ldyBBdXRoKG9wdGlvbnMuY29uZmlnKTtcbiAgICAgICAgdGhpcy5lbmRQb2ludHMgPSBbXTtcbiAgICAgICAgdGhpcy5hcHAgPSBleHByZXNzKCk7XG4gICAgICAgIHRoaXMuc2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIodGhpcy5hcHApO1xuICAgICAgICB0aGlzLmRiID0gbmV3IEFyYW5nbyh0aGlzLmNvbmZpZywgdGhpcy5sb2dzLCB0aGlzLmF1dGgsIHRoaXMudHJhY2VyKTtcbiAgICAgICAgdGhpcy5hZGRFbmRQb2ludCh7XG4gICAgICAgICAgICBwYXRoOiAnL2dyYXBocWwvbWFtJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogcmVzb2x2ZXJzTWFtLFxuICAgICAgICAgICAgdHlwZURlZkZpbGVOYW1lczogWyd0eXBlLWRlZnMtbWFtLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYWRkRW5kUG9pbnQoe1xuICAgICAgICAgICAgcGF0aDogJy9ncmFwaHFsJyxcbiAgICAgICAgICAgIHJlc29sdmVyczogYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKGNyZWF0ZVJlc29sdmVycyh0aGlzLmRiKSksXG4gICAgICAgICAgICB0eXBlRGVmRmlsZU5hbWVzOiBbJ3R5cGUtZGVmcy1nZW5lcmF0ZWQuZ3JhcGhxbCcsICd0eXBlLWRlZnMtY3VzdG9tLmdyYXBocWwnXSxcbiAgICAgICAgICAgIHN1cHBvcnRTdWJzY3JpcHRpb25zOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHN0YXJ0KCkge1xuICAgICAgICB0aGlzLmNsaWVudCA9IGF3YWl0IFRPTkNsaWVudE5vZGVKcy5jcmVhdGUoeyBzZXJ2ZXJzOiBbJyddIH0pO1xuICAgICAgICBhd2FpdCB0aGlzLmRiLnN0YXJ0KCk7XG4gICAgICAgIGNvbnN0IHsgaG9zdCwgcG9ydCB9ID0gdGhpcy5jb25maWcuc2VydmVyO1xuICAgICAgICB0aGlzLnNlcnZlci5saXN0ZW4oeyBob3N0LCBwb3J0IH0sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5kUG9pbnRzLmZvckVhY2goKGVuZFBvaW50OiBFbmRQb2ludCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdHUkFQSFFMJywgYGh0dHA6Ly8ke2hvc3R9OiR7cG9ydH0ke2VuZFBvaW50LnBhdGh9YCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBhZGRFbmRQb2ludChlbmRQb2ludDogRW5kUG9pbnQpIHtcbiAgICAgICAgY29uc3QgdHlwZURlZnMgPSBlbmRQb2ludC50eXBlRGVmRmlsZU5hbWVzXG4gICAgICAgICAgICAubWFwKHggPT4gZnMucmVhZEZpbGVTeW5jKHgsICd1dGYtOCcpKVxuICAgICAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgICBjb25zdCBjb25maWc6IEFwb2xsb1NlcnZlckV4cHJlc3NDb25maWcgPSB7XG4gICAgICAgICAgICB0eXBlRGVmcyxcbiAgICAgICAgICAgIHJlc29sdmVyczogZW5kUG9pbnQucmVzb2x2ZXJzLFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uczoge1xuICAgICAgICAgICAgICAgIG9uQ29ubmVjdChjb25uZWN0aW9uUGFyYW1zOiBPYmplY3QsIF93ZWJzb2NrZXQ6IFdlYlNvY2tldCwgX2NvbnRleHQ6IENvbm5lY3Rpb25Db250ZXh0KTogYW55IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY2Vzc0tleTogY29ubmVjdGlvblBhcmFtcy5hY2Nlc3NLZXkgfHwgY29ubmVjdGlvblBhcmFtcy5hY2Nlc3NrZXksXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udGV4dDogKHsgcmVxLCBjb25uZWN0aW9uIH0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBkYjogdGhpcy5kYixcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VyOiB0aGlzLnRyYWNlcixcbiAgICAgICAgICAgICAgICAgICAgYXV0aDogdGhpcy5hdXRoLFxuICAgICAgICAgICAgICAgICAgICBjbGllbnQ6IHRoaXMuY2xpZW50LFxuICAgICAgICAgICAgICAgICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZWQ6IHRoaXMuc2hhcmVkLFxuICAgICAgICAgICAgICAgICAgICByZW1vdGVBZGRyZXNzOiAocmVxICYmIHJlcS5zb2NrZXQgJiYgcmVxLnNvY2tldC5yZW1vdGVBZGRyZXNzKSB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzS2V5OiBBdXRoLmV4dHJhY3RBY2Nlc3NLZXkocmVxLCBjb25uZWN0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50U3BhbjogUVRyYWNlci5leHRyYWN0UGFyZW50U3Bhbih0aGlzLnRyYWNlciwgY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24gOiByZXEpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERpZFN0YXJ0KF9yZXF1ZXN0Q29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWxsU2VuZFJlc3BvbnNlKGN0eCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSBjdHguY29udGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGNyZWF0ZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDQwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUmVxdWVzdCBtdXN0IHVzZSB0aGUgc2FtZSBhY2Nlc3Mga2V5IGZvciBhbGwgcXVlcmllcyBhbmQgbXV0YXRpb25zJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBhcG9sbG8gPSBuZXcgQXBvbGxvU2VydmVyKGNvbmZpZyk7XG4gICAgICAgIGFwb2xsby5hcHBseU1pZGRsZXdhcmUoeyBhcHA6IHRoaXMuYXBwLCBwYXRoOiBlbmRQb2ludC5wYXRoIH0pO1xuICAgICAgICBpZiAoZW5kUG9pbnQuc3VwcG9ydFN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgIGFwb2xsby5pbnN0YWxsU3Vic2NyaXB0aW9uSGFuZGxlcnModGhpcy5zZXJ2ZXIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW5kUG9pbnRzLnB1c2goZW5kUG9pbnQpO1xuICAgIH1cblxuXG59XG5cbiJdfQ==