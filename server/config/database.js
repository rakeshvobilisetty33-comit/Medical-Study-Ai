import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const connectDB = async () => {
  // Set bufferCommands to false to fail fast instead of buffering queries when connection is offline
  mongoose.set('bufferCommands', false);

  const connString = process.env.MONGO_URI || 'mongodb://localhost:27017/medstudy';
  console.log(`Connecting to MongoDB at: ${connString}`);
  
  try {
    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 1500 // Fail fast if offline
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('MongoDB server is down/not installed. Activating persistent local JSON database fallback...');
    setupFileDBMock();
  }
};

function setupFileDBMock() {
  const DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const getFilePath = (modelName) => path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);

  const readData = (modelName) => {
    const filePath = getFilePath(modelName);
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return [];
    }
  };

  const writeData = (modelName, data) => {
    const filePath = getFilePath(modelName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  };

  // Helper to create chained query mocks (supporting sort, select, limit, lean, populate)
  const createQueryMock = (result) => {
    let currentResult = result;
    const queryMock = {
      sort: function() { return this; },
      select: function() { return this; },
      limit: function(num) {
        if (Array.isArray(currentResult) && typeof num === 'number') {
          currentResult = currentResult.slice(0, num);
        }
        return this;
      },
      lean: function() { return this; },
      populate: function() { return this; },
      exec: async function() { return currentResult; },
      then: function(resolve) {
        if (resolve) {
          resolve(currentResult);
        }
        return Promise.resolve(currentResult);
      }
    };
    return queryMock;
  };

  // Helper to override prototype methods on mongoose.Model.prototype AND all compiled model prototypes
  const overridePrototype = (methodName, fn) => {
    mongoose.Model.prototype[methodName] = fn;
    for (const name in mongoose.models) {
      mongoose.models[name].prototype[methodName] = fn;
    }
  };

  // Helper to override static methods on mongoose.Model AND all compiled model constructors
  const overrideStatic = (methodName, fn) => {
    mongoose.Model[methodName] = fn;
    for (const name in mongoose.models) {
      mongoose.models[name][methodName] = fn;
    }
  };

  // Mock Mongoose save method
  overridePrototype('save', async function() {
    const modelName = this.constructor.modelName;
    const items = readData(modelName);
    
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId().toString();
    }
    
    const obj = this.toObject();
    obj._id = obj._id || this._id.toString();
    
    const index = items.findIndex(item => item._id.toString() === obj._id.toString());
    if (index > -1) {
      items[index] = obj;
    } else {
      obj.createdAt = obj.createdAt || new Date();
      items.push(obj);
    }
    
    writeData(modelName, items);
    return this;
  });

  // Mock Mongoose Model.find
  overrideStatic('find', function(filter = {}) {
    const modelName = this.modelName;
    let items = readData(modelName);
    
    if (filter && Object.keys(filter).length > 0) {
      items = items.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          if (value && typeof value === 'object' && '$in' in value) {
            return value.$in.map(v => v.toString()).includes(item[key]?.toString());
          }
          if (item[key] && item[key].toString() === value?.toString()) return true;
          return item[key] === value;
        });
      });
    }

    const instances = items.map(item => new this(item));
    return createQueryMock(instances);
  });

  // Mock Mongoose Model.findOne
  overrideStatic('findOne', function(filter = {}) {
    const modelName = this.modelName;
    const items = readData(modelName);
    const found = items.find(item => {
      return Object.entries(filter).every(([key, value]) => {
        if (item[key] && item[key].toString() === value?.toString()) return true;
        return item[key] === value;
      });
    });

    const instance = found ? new this(found) : null;
    return createQueryMock(instance);
  });

  // Mock Mongoose Model.findById
  overrideStatic('findById', function(id) {
    const modelName = this.modelName;
    const items = readData(modelName);
    const found = items.find(item => item._id && item._id.toString() === id?.toString());

    const instance = found ? new this(found) : null;
    return createQueryMock(instance);
  });

  // Mock Mongoose Model.findByIdAndDelete
  overrideStatic('findByIdAndDelete', function(id) {
    const modelName = this.modelName;
    const items = readData(modelName);
    const found = items.find(item => item._id && item._id.toString() === id?.toString());
    const filtered = items.filter(item => !item._id || item._id.toString() !== id?.toString());
    writeData(modelName, filtered);

    const instance = found ? new this(found) : null;
    return createQueryMock(instance);
  });

  // Mock Mongoose Model.findByIdAndUpdate
  overrideStatic('findByIdAndUpdate', function(id, update, options = {}) {
    const modelName = this.modelName;
    const items = readData(modelName);
    const index = items.findIndex(item => item._id && item._id.toString() === id?.toString());
    
    let res = null;
    if (index > -1) {
      const current = items[index];
      const fields = update.$set || update;
      Object.assign(current, fields);
      writeData(modelName, items);
      res = options.new ? current : items[index];
    }
    
    const instance = res ? new this(res) : null;
    return createQueryMock(instance);
  });

  // Mock Mongoose Model.deleteMany
  overrideStatic('deleteMany', function(filter = {}) {
    const modelName = this.modelName;
    const items = readData(modelName);
    const filtered = items.filter(item => {
      return !Object.entries(filter).every(([key, value]) => {
        if (item[key] && item[key].toString() === value?.toString()) return true;
        return item[key] === value;
      });
    });
    writeData(modelName, filtered);

    const result = { deletedCount: items.length - filtered.length };
    const queryMock = {
      exec: async function() { return result; },
      then: function(resolve) {
        if (resolve) {
          resolve(result);
        }
        return Promise.resolve(result);
      }
    };
    return queryMock;
  });

  // Mock Mongoose Model.insertMany
  overrideStatic('insertMany', async function(arr) {
    const modelName = this.modelName;
    const items = readData(modelName);
    const savedItems = [];
    
    for (const item of arr) {
      const doc = new this(item);
      if (!doc._id) {
        doc._id = new mongoose.Types.ObjectId().toString();
      }
      const obj = doc.toObject();
      obj._id = obj._id || doc._id.toString();
      obj.createdAt = obj.createdAt || new Date();
      items.push(obj);
      savedItems.push(obj);
    }
    
    writeData(modelName, items);
    return savedItems;
  });
}

export default connectDB;
