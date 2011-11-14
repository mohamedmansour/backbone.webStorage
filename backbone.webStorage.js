/**
 * Backbone webStorage Adapter v1.0
 * 
 * @author Mohamed Mansour http://mohamedmansour.com
 */

/**
 * Represents a table entity.
 *
 * @param {Object} db The active database.
 * @param {string} name The entity name.
 * @constructor
 */
AbstractEntity = function(db, name) {
  if (!db || !name) throw new Error('Invalid AbstractEntity: ' + db + ' - ' + name);
  this.db = db;
  this.name = name;
  
  this.initialize();
};

/**
 * Abstract method that a user should define a method.
 * @return {Object} the data type.
 */
AbstractEntity.prototype.tableDefinition = function() {};

/**
 *
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.initialize = function(callback) {
  var self = this;
  var obj = this.tableDefinition();
  var sql = [];
  sql.push('id TEXT PRIMARY KEY');
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      sql.push(key + ' ' + obj[key]);
    }
  }
  sql.push('UNIQUE (id)');
  this.db.transaction(function(tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS ' + self.name + '(' + sql.join(',') + ')', [],
      function(tx, rs) {
        self.fireCallback({status: true, data: 'Success'}, callback);
      }, 
      function(tx, e) {
        self.fireCallback({status: false, data: 'Cannot create table'}, callback);
    });
  });
};

/**
 *
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.drop = function(callback) {
  var self = this;
  this.db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS ' + self.name, [],
      function(tx, rs) {
        self.fireCallback({status: true, data: 'Success'}, callback);
      }, 
      function(tx, e) {
        self.fireCallback({status: false, data: 'Cannot drop table'}, callback);
    });
  });
};

/**
 * @param {!Object} the object to send to the callback.
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.fireCallback = function(obj, callback) {
  if (callback) {
    callback(obj);
  }
};

/**
 * The entity name.
 *
 * @return {string} The name of the entity.
 */
AbstractEntity.prototype.getName = function() {
  return this.name;
};

/**
 * Logging object.
 */
AbstractEntity.prototype.log = function(msg, obj_opt) {
  var obj = obj_opt || '';
  //console.log(msg, obj);
};

/**
 * Deletes everything from the table.
 *
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.clear = function(callback) {
  var self = this;
  var sql = 'DELETE FROM ' + this.name;
  this.log(sql);
  this.db.transaction(function(tx) {
    tx.executeSql(sql, [], function(tx, rs) {
        self.fireCallback({status: true, data: rs}, callback);
      }, function(tx, e) {
        self.fireCallback({status: false, data: e.message}, callback);
      }
    );
  });
};

/**
 *
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.create = function(obj, callback) {
  var self = this;
  if (!_.isArray(obj)) {
    obj = [obj];
  }
  this.db.transaction(function(tx) {
    for (var i = 0; i < obj.length; i++) {
      var element = obj[i];
      var parameterized = [];
      var keys = [];
      var values = [];
      for (var key in element) {
        if (element.hasOwnProperty(key)) {
          keys.push(key);
          values.push(element[key]);
          parameterized.push('?');
        }
      }
      var id = element.id;
      var sql = 'INSERT INTO ' + self.name + '(' + keys.join(', ') + ') VALUES(' + parameterized.join(', ') + ')';
      self.log(sql, values);

      tx.executeSql(sql, values, function(tx, rs) {
          if (!id) id = rs.insertId;
          self.fireCallback({status: true, data: rs, id: id}, callback);
        }, function(tx, e) {
          self.fireCallback({status: false, data: e.message}, callback);
        }
      );
    }
  });
};

/**
 *
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.destroy = function(id, callback) {
  var self = this;
  var sql = 'DELETE FROM ' + this.name + ' WHERE id = ?';
  this.log(sql, id);
  this.db.transaction(function(tx) {
    tx.executeSql(sql, [id], function(tx, rs) {
        self.fireCallback({status: true, data: rs}, callback);
      }, function(tx, e) {
        self.fireCallback({status: false, data: e.message}, callback);
      }
    );
  });
};

/**
 *
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.update = function(obj, callback) {
  var self = this;
  if (!_.isArray(obj)) {
    obj = [obj];
  }

  this.db.transaction(function(tx) {
    for (var i = 0; i < obj.length; i++) {
      var element = obj[i];
      if (!element.id) {
        self.fireCallback({status: false, data: 'No ID present for ' + self.name}, callback);
        continue;
      }

      // Make sure we have at least two keys in the object.
      var keyCount = 0;
      var update = [];
      var data = [];
      for (var key in element) {
        if (element.hasOwnProperty(key)) {
          keyCount++;
          if (key != 'id') {
            update.push(key + ' = ?')
            data.push(element[key]);
          }
        }
      }
      data.push(element.id)

      if (keyCount < 1) {
        self.fireCallback({status: false, data: 'No keys to update for ' + self.name}, callback);
        continue;
      }

      var sql = 'UPDATE ' + self.name + ' SET ' + update.join(', ') + ' WHERE id = ?';
      self.log(sql, data);
      tx.executeSql(sql, data, function(tx, rs) {
          self.fireCallback({status: true, data: rs}, callback);
        }, function(tx, e) {
          self.fireCallback({status: false, data: e.message}, callback);
        }
      );
    }
  });
};

/**
 *
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.find = function(obj, callback) {
  var self = this;
  var keys = [];
  var values = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key + ' = ?');
      values.push(obj[key]);
    }
  }
  if (values.length == 0) {
    keys.push('1 = 1');
  }
  var sql = 'SELECT * FROM ' + this.name + ' WHERE ' + keys.join(' AND ');
  this.log(sql);
  this.db.readTransaction(function(tx) {
    tx.executeSql(sql, values, function (tx, rs) {
        var data = [];
        for (var i = 0; i < rs.rows.length; i++) {
          data.push(rs.rows.item(i));
        }
        self.fireCallback({status: true, data: data}, callback);
      }, function(e) {
        console.error('Find', e.message);
        self.fireCallback({status: false, data: e.message}, callback);
      }
    );
  });
};

/**
 *
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.findAll = function(callback) {
  this.find({}, callback);
};

/**
 *
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.count = function(obj, callback) {
  var self = this;
  var keys = [];
  var values = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key + ' = ?');
      values.push(obj[key]);
    }
  }
  if (values.length == 0) {
    keys.push('1 = 1');
  }
  var sql = 'SELECT count(*) as count FROM ' + this.name + ' WHERE ' + keys.join(' AND ');
  this.log(sql);
  this.db.readTransaction(function(tx) {
    tx.executeSql(sql, values, function (tx, rs) {
        var count = rs.rows.item(0).count;
        self.fireCallback({status: true, data: count}, callback);
      }, function(e) {
        console.error('Count', e.message);
        self.fireCallback({status: false, data: e.message}, callback);
      }
    );
  });
};

/**
 * @param {Object.<string, !Object>} obj The object to save.
 * @param {function(!Object)} callback The listener to call when completed.
 */
AbstractEntity.prototype.save = function(obj, callback) {
  var self = this;
  self.count({id: obj.id}, function(result) {
    if (result.data == 0) {
      self.persist(obj, callback);
    }
    else {
      self.update(obj, callback);
    }
  });
};
 
// Override `Backbone.sync` to use delegate to the model or collection's
// *webStorage* property, which should be an instance of `Store`.
Backbone.sync = function(method, model, options, error) {

  // Backwards compatibility with Backbone <= 0.3.3
  if (typeof options == 'function') {
    options = {
      success: options,
      error: error
    };
  }

  var resp = function(resp) {
    if (resp.status) {
      options.success(method != 'read' ? model : resp.data);
    }
    else {
      options.error('Record not found ' + resp.data);
    }
  };

  var store = model.webStorage || model.collection.webStorage;

  switch (method) {
    case 'read':    model.id ? store.find({id: model.id}, resp) : store.findAll(resp); break;
    case 'create':  store.create(model.attributes, resp); break;
    case 'update':  store.update(model.attributes, resp); break;
    case 'delete':  store.destroy(model.id, resp); break;
  }
};