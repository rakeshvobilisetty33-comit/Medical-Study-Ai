import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const connectDB = async () => {
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

  // Mock Mongoose save method
  mongoose.Model.prototype.save = async function() {
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
  };

  // Mock Mongoose Model.find
  mongoose.Model.find = function(filter = {}) {
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

    const queryMock = {
      sort: function() { return this; },
      exec: async function() { return items; },
      then: function(resolve) {
        if (resolve) {
          resolve(items);
        }
        return Promise.resolve(items);
      }
    };
    return queryMock;
  };

  // Mock Mongoose Model.findOne
  mongoose.Model.findOne = function(filter = {}) {
    const modelName = this.modelName;
    const items = readData(modelName);
    const found = items.find(item => {
      return Object.entries(filter).every(([key, value]) => {
        if (item[key] && item[key].toString() === value?.toString()) return true;
        return item[key] === value;
      });
    });

    const queryMock = {
      exec: async function() { return found; },
      then: function(resolve) {
        if (resolve) {
          resolve(found);
        }
        return Promise.resolve(found);
      }
    };
    return queryMock;
  };

  // Mock Mongoose Model.findById
  mongoose.Model.findById = function(id) {
    const modelName = this.modelName;
    const items = readData(modelName);
    const found = items.find(item => item._id && item._id.toString() === id?.toString());

    const queryMock = {
      exec: async function() { return found; },
      then: function(resolve) {
        if (resolve) {
          resolve(found);
        }
        return Promise.resolve(found);
      }
    };
    return queryMock;
  };

  // Mock Mongoose Model.findByIdAndDelete
  mongoose.Model.findByIdAndDelete = function(id) {
    const modelName = this.modelName;
    const items = readData(modelName);
    const found = items.find(item => item._id && item._id.toString() === id?.toString());
    const filtered = items.filter(item => !item._id || item._id.toString() !== id?.toString());
    writeData(modelName, filtered);

    const queryMock = {
      exec: async function() { return found; },
      then: function(resolve) {
        if (resolve) {
          resolve(found);
        }
        return Promise.resolve(found);
      }
    };
    return queryMock;
  };

  // Mock Mongoose Model.findByIdAndUpdate
  mongoose.Model.findByIdAndUpdate = function(id, update, options = {}) {
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
    
    const queryMock = {
      exec: async function() { return res; },
      then: function(resolve) {
        if (resolve) {
          resolve(res);
        }
        return Promise.resolve(res);
      }
    };
    return queryMock;
  };

  // Mock Mongoose Model.deleteMany
  mongoose.Model.deleteMany = function(filter = {}) {
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
  };
}

export default connectDB;
