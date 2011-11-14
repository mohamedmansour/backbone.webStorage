$(document).ready(function() {
  module('webStorage');
  
  // Move to some base class.
  var inherits = function(childCtor, parentCtor) {
    function tempCtor() {};
    tempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new tempCtor();
    childCtor.prototype.constructor = childCtor;
  };
  
  var onDatabaseCreated = function() {
    console.log('Success Creating the table.');
      
    // Make sure there is no library collection when we start
    library.webStorage.clear(onTest);
  };
  
  // Create Library DB Object.
  var LibraryEntity = function(db) {
    AbstractEntity.call(this, db, 'library');
  };
  inherits(LibraryEntity, AbstractEntity);

  LibraryEntity.prototype.tableDefinition = function() {
    return {
      author: 'TEXT',
      title:  'TEXT',
      length: 'NUMBER'
    }
  };
  
  // TODO: Should we abstract this? Or is it already abstracted enough?
  var db_size = 2 * 1024 * 1024;
  var db = openDatabase('Backbone WebStorage Test', '1.0', 'webStorage', db_size);

  // Create Library Collection.
  var Library = Backbone.Collection.extend({
      webStorage: new LibraryEntity(db)
  });
  
  var library = new Library();
  
  // Start testing.
  var onTest = function() {
    var attrs = {
      title  : 'The Tempest',
      author : 'Bill Shakespeare',
      length : 123
    };
    // read from the library object that shouldn't exist when we start
    test("collection", function() {
      equals(library.length, 0, 'empty read');
      library.fetch({
        success: function(collection, resp) {
          library.create(attrs, {
            success: function(nextModel, response, xhr) {
              equals(library.length, 1, 'one item added');
              equals(library.first().get('title'), 'The Tempest', 'title was read');
              equals(library.first().get('author'), 'Bill Shakespeare', 'author was read');
              equals(library.first().get('length'), 123, 'length was read');
              library.first().save({id: '1-the-tempest', author: 'William Shakespeare'}, {
                success: function(model, resp) {
                  equals(library.first().get('id'), '1-the-tempest', 'verify ID update');
                  equals(library.first().get('title'), 'The Tempest', 'verify title is still there');
                  equals(library.first().get('author'), 'William Shakespeare', 'verify author update');
                  equals(library.first().get('length'), 123, 'verify length is still there');
                  library.each(function(book) {
                    book.destroy();
                  });
                  equals(library.length, 0, 'item was destroyed and library is empty');  
                }
              });
            }
          });
        }
      });
    });
  };
});