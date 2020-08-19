"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolversMam = void 0;

var _database = _interopRequireDefault(require("./database"));

var _collection = require("./collection");

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  version
} = (0, _utils.packageJson)();

// Query
function info() {
  return {
    version
  };
}

function stat(_parent, args, context) {
  (0, _collection.mamAccessRequired)(context, args);
  const db = context.db;
  let totalWaitForCount = 0;
  let totalSubscriptionCount = 0;
  const collections = db.collections.map(collection => {
    totalWaitForCount += collection.waitForCount;
    totalSubscriptionCount += collection.subscriptionCount;
    return {
      name: collection.name,
      subscriptionCount: collection.subscriptionCount,
      waitForCount: collection.waitForCount,
      maxQueueSize: collection.maxQueueSize,
      subscriptions: [],
      waitFor: []
    };
  });
  return {
    waitForCount: totalWaitForCount,
    subscriptionCount: totalSubscriptionCount,
    collections
  };
}

async function getCollections(_parent, args, context) {
  (0, _collection.mamAccessRequired)(context, args);
  const db = context.db;
  const collections = [];

  for (const collection of db.collections) {
    const indexes = [];
    const dbCollection = collection.dbCollection();

    for (const index of await dbCollection.indexes()) {
      indexes.push(index.fields.join(', '));
    }

    collections.push({
      name: collection.name,
      count: (await dbCollection.count()).count,
      indexes
    });
  }

  return collections;
}

async function dropCachedDbInfo(_parent, args, context) {
  (0, _collection.mamAccessRequired)(context, args);
  context.db.dropCachedDbInfo();
  return true;
} // Mutation


const resolversMam = {
  Query: {
    info,
    getCollections,
    stat
  },
  Mutation: {
    dropCachedDbInfo
  }
};
exports.resolversMam = resolversMam;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtbWFtLmpzIl0sIm5hbWVzIjpbInZlcnNpb24iLCJpbmZvIiwic3RhdCIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsImRiIiwidG90YWxXYWl0Rm9yQ291bnQiLCJ0b3RhbFN1YnNjcmlwdGlvbkNvdW50IiwiY29sbGVjdGlvbnMiLCJtYXAiLCJjb2xsZWN0aW9uIiwid2FpdEZvckNvdW50Iiwic3Vic2NyaXB0aW9uQ291bnQiLCJuYW1lIiwibWF4UXVldWVTaXplIiwic3Vic2NyaXB0aW9ucyIsIndhaXRGb3IiLCJnZXRDb2xsZWN0aW9ucyIsImluZGV4ZXMiLCJkYkNvbGxlY3Rpb24iLCJpbmRleCIsInB1c2giLCJmaWVsZHMiLCJqb2luIiwiY291bnQiLCJkcm9wQ2FjaGVkRGJJbmZvIiwicmVzb2x2ZXJzTWFtIiwiUXVlcnkiLCJNdXRhdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUVBOztBQUNBOztBQUVBOzs7O0FBQ0EsTUFBTTtBQUFDQSxFQUFBQTtBQUFELElBQVkseUJBQWxCOztBQWlDQTtBQUVBLFNBQVNDLElBQVQsR0FBc0I7QUFDbEIsU0FBTztBQUNIRCxJQUFBQTtBQURHLEdBQVA7QUFHSDs7QUFFRCxTQUFTRSxJQUFULENBQWNDLE9BQWQsRUFBNEJDLElBQTVCLEVBQXVDQyxPQUF2QyxFQUErRTtBQUMzRSxxQ0FBa0JBLE9BQWxCLEVBQTJCRCxJQUEzQjtBQUNBLFFBQU1FLEVBQWEsR0FBR0QsT0FBTyxDQUFDQyxFQUE5QjtBQUNBLE1BQUlDLGlCQUFpQixHQUFHLENBQXhCO0FBQ0EsTUFBSUMsc0JBQXNCLEdBQUcsQ0FBN0I7QUFDQSxRQUFNQyxXQUFXLEdBQUdILEVBQUUsQ0FBQ0csV0FBSCxDQUFlQyxHQUFmLENBQW9CQyxVQUFELElBQTZCO0FBQ2hFSixJQUFBQSxpQkFBaUIsSUFBSUksVUFBVSxDQUFDQyxZQUFoQztBQUNBSixJQUFBQSxzQkFBc0IsSUFBSUcsVUFBVSxDQUFDRSxpQkFBckM7QUFDQSxXQUFPO0FBQ0hDLE1BQUFBLElBQUksRUFBRUgsVUFBVSxDQUFDRyxJQURkO0FBRUhELE1BQUFBLGlCQUFpQixFQUFFRixVQUFVLENBQUNFLGlCQUYzQjtBQUdIRCxNQUFBQSxZQUFZLEVBQUVELFVBQVUsQ0FBQ0MsWUFIdEI7QUFJSEcsTUFBQUEsWUFBWSxFQUFFSixVQUFVLENBQUNJLFlBSnRCO0FBS0hDLE1BQUFBLGFBQWEsRUFBRSxFQUxaO0FBTUhDLE1BQUFBLE9BQU8sRUFBRTtBQU5OLEtBQVA7QUFRSCxHQVhtQixDQUFwQjtBQVlBLFNBQU87QUFDSEwsSUFBQUEsWUFBWSxFQUFFTCxpQkFEWDtBQUVITSxJQUFBQSxpQkFBaUIsRUFBRUwsc0JBRmhCO0FBR0hDLElBQUFBO0FBSEcsR0FBUDtBQUtIOztBQUVELGVBQWVTLGNBQWYsQ0FBOEJmLE9BQTlCLEVBQTRDQyxJQUE1QyxFQUF1REMsT0FBdkQsRUFBdUg7QUFDbkgscUNBQWtCQSxPQUFsQixFQUEyQkQsSUFBM0I7QUFDQSxRQUFNRSxFQUFhLEdBQUdELE9BQU8sQ0FBQ0MsRUFBOUI7QUFDQSxRQUFNRyxXQUFnQyxHQUFHLEVBQXpDOztBQUNBLE9BQUssTUFBTUUsVUFBWCxJQUF5QkwsRUFBRSxDQUFDRyxXQUE1QixFQUF5QztBQUNyQyxVQUFNVSxPQUFpQixHQUFHLEVBQTFCO0FBQ0EsVUFBTUMsWUFBWSxHQUFHVCxVQUFVLENBQUNTLFlBQVgsRUFBckI7O0FBQ0EsU0FBSyxNQUFNQyxLQUFYLElBQW9CLE1BQU1ELFlBQVksQ0FBQ0QsT0FBYixFQUExQixFQUFrRDtBQUM5Q0EsTUFBQUEsT0FBTyxDQUFDRyxJQUFSLENBQWFELEtBQUssQ0FBQ0UsTUFBTixDQUFhQyxJQUFiLENBQWtCLElBQWxCLENBQWI7QUFDSDs7QUFDRGYsSUFBQUEsV0FBVyxDQUFDYSxJQUFaLENBQWlCO0FBQ2JSLE1BQUFBLElBQUksRUFBRUgsVUFBVSxDQUFDRyxJQURKO0FBRWJXLE1BQUFBLEtBQUssRUFBRSxDQUFDLE1BQU1MLFlBQVksQ0FBQ0ssS0FBYixFQUFQLEVBQTZCQSxLQUZ2QjtBQUdiTixNQUFBQTtBQUhhLEtBQWpCO0FBS0g7O0FBQ0QsU0FBT1YsV0FBUDtBQUNIOztBQUVELGVBQWVpQixnQkFBZixDQUFnQ3ZCLE9BQWhDLEVBQThDQyxJQUE5QyxFQUF5REMsT0FBekQsRUFBNkc7QUFDekcscUNBQWtCQSxPQUFsQixFQUEyQkQsSUFBM0I7QUFDQUMsRUFBQUEsT0FBTyxDQUFDQyxFQUFSLENBQVdvQixnQkFBWDtBQUNBLFNBQU8sSUFBUDtBQUNILEMsQ0FFRDs7O0FBRU8sTUFBTUMsWUFBWSxHQUFHO0FBQ3hCQyxFQUFBQSxLQUFLLEVBQUU7QUFDSDNCLElBQUFBLElBREc7QUFFSGlCLElBQUFBLGNBRkc7QUFHSGhCLElBQUFBO0FBSEcsR0FEaUI7QUFNeEIyQixFQUFBQSxRQUFRLEVBQUU7QUFDTkgsSUFBQUE7QUFETTtBQU5jLENBQXJCIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IFFEYXRhYmFzZSBmcm9tIFwiLi9kYXRhYmFzZVwiO1xuaW1wb3J0IHsgUUNvbGxlY3Rpb24sIG1hbUFjY2Vzc1JlcXVpcmVkIH0gZnJvbSBcIi4vY29sbGVjdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCB9IGZyb20gXCIuL3Jlc29sdmVycy1jdXN0b21cIjtcbmltcG9ydCB7cGFja2FnZUpzb259IGZyb20gJy4vdXRpbHMnO1xuY29uc3Qge3ZlcnNpb259ID0gcGFja2FnZUpzb24oKTtcblxudHlwZSBJbmZvID0ge1xuICAgIHZlcnNpb246IHN0cmluZyxcbn1cblxudHlwZSBMaXN0ZW5lclN0YXQgPSB7XG4gICAgZmlsdGVyOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBzdHJpbmcsXG4gICAgcXVldWVTaXplOiBudW1iZXIsXG4gICAgZXZlbnRDb3VudDogbnVtYmVyLFxuICAgIHNlY29uZHNBY3RpdmU6IG51bWJlcixcbn1cblxudHlwZSBDb2xsZWN0aW9uU3RhdCA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcixcbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcixcbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcixcbiAgICBzdWJzY3JpcHRpb25zOiBMaXN0ZW5lclN0YXRbXSxcbiAgICB3YWl0Rm9yOiBMaXN0ZW5lclN0YXRbXSxcbn1cblxudHlwZSBTdGF0ID0ge1xuICAgIGNvbGxlY3Rpb25zOiBDb2xsZWN0aW9uU3RhdFtdXG59XG5cbnR5cGUgQ29sbGVjdGlvblN1bW1hcnkgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgaW5kZXhlczogc3RyaW5nW10sXG59XG5cbi8vIFF1ZXJ5XG5cbmZ1bmN0aW9uIGluZm8oKTogSW5mbyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbixcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzdGF0KF9wYXJlbnQ6IGFueSwgYXJnczogYW55LCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFN0YXQge1xuICAgIG1hbUFjY2Vzc1JlcXVpcmVkKGNvbnRleHQsIGFyZ3MpO1xuICAgIGNvbnN0IGRiOiBRRGF0YWJhc2UgPSBjb250ZXh0LmRiO1xuICAgIGxldCB0b3RhbFdhaXRGb3JDb3VudCA9IDA7XG4gICAgbGV0IHRvdGFsU3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gZGIuY29sbGVjdGlvbnMubWFwKChjb2xsZWN0aW9uOiBRQ29sbGVjdGlvbikgPT4ge1xuICAgICAgICB0b3RhbFdhaXRGb3JDb3VudCArPSBjb2xsZWN0aW9uLndhaXRGb3JDb3VudDtcbiAgICAgICAgdG90YWxTdWJzY3JpcHRpb25Db3VudCArPSBjb2xsZWN0aW9uLnN1YnNjcmlwdGlvbkNvdW50O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uQ291bnQ6IGNvbGxlY3Rpb24uc3Vic2NyaXB0aW9uQ291bnQsXG4gICAgICAgICAgICB3YWl0Rm9yQ291bnQ6IGNvbGxlY3Rpb24ud2FpdEZvckNvdW50LFxuICAgICAgICAgICAgbWF4UXVldWVTaXplOiBjb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSxcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnM6IFtdLFxuICAgICAgICAgICAgd2FpdEZvcjogW10sXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB3YWl0Rm9yQ291bnQ6IHRvdGFsV2FpdEZvckNvdW50LFxuICAgICAgICBzdWJzY3JpcHRpb25Db3VudDogdG90YWxTdWJzY3JpcHRpb25Db3VudCxcbiAgICAgICAgY29sbGVjdGlvbnMsXG4gICAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0Q29sbGVjdGlvbnMoX3BhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxDb2xsZWN0aW9uU3VtbWFyeVtdPiB7XG4gICAgbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dCwgYXJncyk7XG4gICAgY29uc3QgZGI6IFFEYXRhYmFzZSA9IGNvbnRleHQuZGI7XG4gICAgY29uc3QgY29sbGVjdGlvbnM6IENvbGxlY3Rpb25TdW1tYXJ5W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNvbGxlY3Rpb24gb2YgZGIuY29sbGVjdGlvbnMpIHtcbiAgICAgICAgY29uc3QgaW5kZXhlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgZGJDb2xsZWN0aW9uID0gY29sbGVjdGlvbi5kYkNvbGxlY3Rpb24oKTtcbiAgICAgICAgZm9yIChjb25zdCBpbmRleCBvZiBhd2FpdCBkYkNvbGxlY3Rpb24uaW5kZXhlcygpKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goaW5kZXguZmllbGRzLmpvaW4oJywgJykpO1xuICAgICAgICB9XG4gICAgICAgIGNvbGxlY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgbmFtZTogY29sbGVjdGlvbi5uYW1lLFxuICAgICAgICAgICAgY291bnQ6IChhd2FpdCBkYkNvbGxlY3Rpb24uY291bnQoKSkuY291bnQsXG4gICAgICAgICAgICBpbmRleGVzLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbGxlY3Rpb25zO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkcm9wQ2FjaGVkRGJJbmZvKF9wYXJlbnQ6IGFueSwgYXJnczogYW55LCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8Qm9vbGVhbj4ge1xuICAgIG1hbUFjY2Vzc1JlcXVpcmVkKGNvbnRleHQsIGFyZ3MpO1xuICAgIGNvbnRleHQuZGIuZHJvcENhY2hlZERiSW5mbygpO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG4vLyBNdXRhdGlvblxuXG5leHBvcnQgY29uc3QgcmVzb2x2ZXJzTWFtID0ge1xuICAgIFF1ZXJ5OiB7XG4gICAgICAgIGluZm8sXG4gICAgICAgIGdldENvbGxlY3Rpb25zLFxuICAgICAgICBzdGF0XG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgICAgICBkcm9wQ2FjaGVkRGJJbmZvLFxuICAgIH1cbn07XG4iXX0=