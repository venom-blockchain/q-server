"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanError = cleanError;
exports.createError = createError;
exports.wrap = wrap;
exports.toLog = toLog;
exports.RegistryMap = void 0;

function cleanError(error) {
  if ('ArangoError' in error) {
    return error.ArangoError;
  }

  delete error.request;
  delete error.response;
  return error;
}

function createError(code, message, source = 'graphql') {
  const error = new Error(message);
  error.source = source;
  error.code = code;
  return error;
}

function isInternalServerError(error) {
  if ('type' in error && error.type === 'system') {
    return true;
  }

  if ('errno' in error && 'syscall' in error) {
    return true;
  }
}

async function wrap(log, op, args, fetch) {
  try {
    return await fetch();
  } catch (err) {
    let cleaned = cleanError(err);
    log.error('FAILED', op, args, cleaned);

    if (isInternalServerError(cleaned)) {
      cleaned = createError(500, 'Service temporary unavailable');
    }

    throw cleaned;
  }
}

class RegistryMap {
  constructor(name) {
    this.name = name;
    this.lastId = 0;
    this.items = new Map();
  }

  add(item) {
    let id = this.lastId;

    do {
      id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 1;
    } while (this.items.has(id));

    this.lastId = id;
    this.items.set(id, item);
    return id;
  }

  remove(id) {
    if (!this.items.delete(id)) {
      console.error(`Failed to remove ${this.name}: item with id [${id}] does not exists`);
    }
  }

  entries() {
    return [...this.items.entries()];
  }

  values() {
    return [...this.items.values()];
  }

}

exports.RegistryMap = RegistryMap;

function toLog(value, objs) {
  const typeOf = typeof value;

  switch (typeOf) {
    case "undefined":
    case "boolean":
    case "number":
    case "bigint":
    case "symbol":
      return value;

    case "string":
      if (value.length > 80) {
        return `${value.substr(0, 50)}… [${value.length}]`;
      }

      return value;

    case "function":
      return undefined;

    default:
      if (value === null) {
        return value;
      }

      if (objs && objs.includes(value)) {
        return undefined;
      }

      const newObjs = objs ? [...objs, value] : [value];

      if (Array.isArray(value)) {
        return value.map(x => toLog(x, newObjs));
      }

      const valueToLog = {};
      Object.entries(value).forEach(([n, v]) => {
        const propertyValueToLog = toLog(v, newObjs);

        if (propertyValueToLog !== undefined) {
          valueToLog[n] = propertyValueToLog;
        }
      });
      return valueToLog;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci91dGlscy5qcyJdLCJuYW1lcyI6WyJjbGVhbkVycm9yIiwiZXJyb3IiLCJBcmFuZ29FcnJvciIsInJlcXVlc3QiLCJyZXNwb25zZSIsImNyZWF0ZUVycm9yIiwiY29kZSIsIm1lc3NhZ2UiLCJzb3VyY2UiLCJFcnJvciIsImlzSW50ZXJuYWxTZXJ2ZXJFcnJvciIsInR5cGUiLCJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnIiLCJjbGVhbmVkIiwiUmVnaXN0cnlNYXAiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJsYXN0SWQiLCJpdGVtcyIsIk1hcCIsImFkZCIsIml0ZW0iLCJpZCIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJoYXMiLCJzZXQiLCJyZW1vdmUiLCJkZWxldGUiLCJjb25zb2xlIiwiZW50cmllcyIsInZhbHVlcyIsInRvTG9nIiwidmFsdWUiLCJvYmpzIiwidHlwZU9mIiwibGVuZ3RoIiwic3Vic3RyIiwidW5kZWZpbmVkIiwiaW5jbHVkZXMiLCJuZXdPYmpzIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwieCIsInZhbHVlVG9Mb2ciLCJPYmplY3QiLCJmb3JFYWNoIiwibiIsInYiLCJwcm9wZXJ0eVZhbHVlVG9Mb2ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBRU8sU0FBU0EsVUFBVCxDQUFvQkMsS0FBcEIsRUFBcUM7QUFDeEMsTUFBSSxpQkFBaUJBLEtBQXJCLEVBQTRCO0FBQ3hCLFdBQU9BLEtBQUssQ0FBQ0MsV0FBYjtBQUNIOztBQUNELFNBQU9ELEtBQUssQ0FBQ0UsT0FBYjtBQUNBLFNBQU9GLEtBQUssQ0FBQ0csUUFBYjtBQUNBLFNBQU9ILEtBQVA7QUFDSDs7QUFHTSxTQUFTSSxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsT0FBbkMsRUFBb0RDLE1BQWMsR0FBRyxTQUFyRSxFQUF1RjtBQUMxRixRQUFNUCxLQUFLLEdBQUcsSUFBSVEsS0FBSixDQUFVRixPQUFWLENBQWQ7QUFD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Q0FBYixFQUFnQixFQUFoQixDQUFvQixNQUFLSixLQUFLLENBQUNHLE1BQU8sR0FBaEQ7QUFDSDs7QUFDRCxhQUFPSCxLQUFQOztBQUNKLFNBQUssVUFBTDtBQUNJLGFBQU9LLFNBQVA7O0FBQ0o7QUFDSSxVQUFJTCxLQUFLLEtBQUssSUFBZCxFQUFvQjtBQUNoQixlQUFPQSxLQUFQO0FBQ0g7O0FBQ0QsVUFBSUMsSUFBSSxJQUFJQSxJQUFJLENBQUNLLFFBQUwsQ0FBY04sS0FBZCxDQUFaLEVBQWtDO0FBQzlCLGVBQU9LLFNBQVA7QUFDSDs7QUFDRCxZQUFNRSxPQUFPLEdBQUdOLElBQUksR0FBRyxDQUFDLEdBQUdBLElBQUosRUFBVUQsS0FBVixDQUFILEdBQXNCLENBQUNBLEtBQUQsQ0FBMUM7O0FBQ0EsVUFBSVEsS0FBSyxDQUFDQyxPQUFOLENBQWNULEtBQWQsQ0FBSixFQUEwQjtBQUN0QixlQUFPQSxLQUFLLENBQUNVLEdBQU4sQ0FBVUMsQ0FBQyxJQUFJWixLQUFLLENBQUNZLENBQUQsRUFBSUosT0FBSixDQUFwQixDQUFQO0FBQ0g7O0FBQ0QsWUFBTUssVUFBNkIsR0FBRyxFQUF0QztBQUNBQyxNQUFBQSxNQUFNLENBQUNoQixPQUFQLENBQWVHLEtBQWYsRUFBc0JjLE9BQXRCLENBQThCLENBQUMsQ0FBQ0MsQ0FBRCxFQUFJQyxDQUFKLENBQUQsS0FBWTtBQUN0QyxjQUFNQyxrQkFBa0IsR0FBR2xCLEtBQUssQ0FBQ2lCLENBQUQsRUFBSVQsT0FBSixDQUFoQzs7QUFDQSxZQUFJVSxrQkFBa0IsS0FBS1osU0FBM0IsRUFBc0M7QUFDbENPLFVBQUFBLFVBQVUsQ0FBQ0csQ0FBRCxDQUFWLEdBQWdCRSxrQkFBaEI7QUFDSDtBQUNKLE9BTEQ7QUFNQSxhQUFPTCxVQUFQO0FBaENKO0FBa0NIIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1FMb2d9IGZyb20gJy4vbG9ncyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbkVycm9yKGVycm9yOiBhbnkpOiBhbnkge1xuICAgIGlmICgnQXJhbmdvRXJyb3InIGluIGVycm9yKSB7XG4gICAgICAgIHJldHVybiBlcnJvci5BcmFuZ29FcnJvcjtcbiAgICB9XG4gICAgZGVsZXRlIGVycm9yLnJlcXVlc3Q7XG4gICAgZGVsZXRlIGVycm9yLnJlc3BvbnNlO1xuICAgIHJldHVybiBlcnJvcjtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3IoY29kZTogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nID0gJ2dyYXBocWwnKTogRXJyb3Ige1xuICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIChlcnJvcjogYW55KS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgKGVycm9yOiBhbnkpLmNvZGUgPSBjb2RlO1xuICAgIHJldHVybiBlcnJvcjtcbn1cblxuZnVuY3Rpb24gaXNJbnRlcm5hbFNlcnZlckVycm9yKGVycm9yOiBFcnJvcik6IGJvb2xlYW4ge1xuICAgIGlmICgndHlwZScgaW4gZXJyb3IgJiYgZXJyb3IudHlwZSA9PT0gJ3N5c3RlbScpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICgnZXJybm8nIGluIGVycm9yICYmICdzeXNjYWxsJyBpbiBlcnJvcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cmFwPFI+KGxvZzogUUxvZywgb3A6IHN0cmluZywgYXJnczogYW55LCBmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaCgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsZXQgY2xlYW5lZCA9IGNsZWFuRXJyb3IoZXJyKTtcbiAgICAgICAgbG9nLmVycm9yKCdGQUlMRUQnLCBvcCwgYXJncywgY2xlYW5lZCk7XG4gICAgICAgIGlmIChpc0ludGVybmFsU2VydmVyRXJyb3IoY2xlYW5lZCkpIHtcbiAgICAgICAgICAgIGNsZWFuZWQgPSBjcmVhdGVFcnJvcig1MDAsICdTZXJ2aWNlIHRlbXBvcmFyeSB1bmF2YWlsYWJsZScpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGNsZWFuZWQ7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVnaXN0cnlNYXA8VD4ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpdGVtczogTWFwPG51bWJlciwgVD47XG4gICAgbGFzdElkOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSAwO1xuICAgICAgICB0aGlzLml0ZW1zID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGFkZChpdGVtOiBUKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IGlkID0gdGhpcy5sYXN0SWQ7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGlkID0gaWQgPCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiA/IGlkICsgMSA6IDE7XG4gICAgICAgIH0gd2hpbGUgKHRoaXMuaXRlbXMuaGFzKGlkKSk7XG4gICAgICAgIHRoaXMubGFzdElkID0gaWQ7XG4gICAgICAgIHRoaXMuaXRlbXMuc2V0KGlkLCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIHJlbW92ZShpZDogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5pdGVtcy5kZWxldGUoaWQpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gcmVtb3ZlICR7dGhpcy5uYW1lfTogaXRlbSB3aXRoIGlkIFske2lkfV0gZG9lcyBub3QgZXhpc3RzYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbnRyaWVzKCk6IFtudW1iZXIsIFRdW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMuZW50cmllcygpXTtcbiAgICB9XG5cbiAgICB2YWx1ZXMoKTogVFtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLnZhbHVlcygpXTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0xvZyh2YWx1ZTogYW55LCBvYmpzPzogT2JqZWN0W10pOiBhbnkge1xuICAgIGNvbnN0IHR5cGVPZiA9IHR5cGVvZiB2YWx1ZTtcbiAgICBzd2l0Y2ggKHR5cGVPZikge1xuICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICBjYXNlIFwiYmlnaW50XCI6XG4gICAgY2FzZSBcInN5bWJvbFwiOlxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID4gODApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHt2YWx1ZS5zdWJzdHIoMCwgNTApfeKApiBbJHt2YWx1ZS5sZW5ndGh9XWBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9ianMgJiYgb2Jqcy5pbmNsdWRlcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV3T2JqcyA9IG9ianMgPyBbLi4ub2JqcywgdmFsdWVdIDogW3ZhbHVlXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUubWFwKHggPT4gdG9Mb2coeCwgbmV3T2JqcykpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlVG9Mb2c6IHsgW3N0cmluZ106IGFueSB9ID0ge307XG4gICAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlKS5mb3JFYWNoKChbbiwgdl0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5VmFsdWVUb0xvZyA9IHRvTG9nKHYsIG5ld09ianMpO1xuICAgICAgICAgICAgaWYgKHByb3BlcnR5VmFsdWVUb0xvZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVUb0xvZ1tuXSA9IHByb3BlcnR5VmFsdWVUb0xvZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWx1ZVRvTG9nXG4gICAgfVxufVxuIl19