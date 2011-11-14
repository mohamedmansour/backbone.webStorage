Backbone.js webStorage integration
==================================

This was done during a night hackathon on Google+ Hangouts:
https://plus.google.com/116805285176805120365/posts/BCKjBb9HRPA

I picked backbone.js and decided to create a WebSQL Storage for
allowing Backbone.JS framework to run in offline mode. 

The following framework is currently being used in Circle Management
Chrome Extension to manage circles/people/and relationships.

This is an extremely messy way to create ORM for SQL in JS.


Usage
-----

 - Create your Entity, it will automatically create the table when
   initialized.

    ArticleEntity = function(db) {
      AbstractEntity.call(this, db, 'article');
    };
    inherits(ArticleEntity, AbstractEntity);

    ArticleEntity.prototype.tableDefinition = function() {
      return {
        author: 'TEXT',
        title: 'TEXT',
        summary: 'TEXT'
        category: {type: 'NUMBER', foreign: 'category'}
      };
    }


    CategoryEntity = function(db) {
       AbstractEntity.call(this, db, 'category');
    };
    inherits(CategoryEntity, AbstractEntity);

    CategoryEntity.prototype.tableDefinition = function() {
      return {
        name: 'TEXT',
        description: 'TEXT',
        unique: [
          ['name']
        ]
      };
    };


 - Test your entity by adding some values. You can use any CRUD method.


    var db = openDatabase('Some Test', '1.0', 'test', 2 * 1024 * 1024);
    var entity = new PersonCircle

    var categoryEntity = new CategoryEntity(db);
    categoryEntity.create({name: 'Technology'});
    categoryEntity.create({name: 'Science', description: 'Hardcore historical science'}, function(res) {
      var articleEntity = new ArticleEntity(db);
      articleEntity.create({author: 'Mohamed Mansour', title: 'Hello World', category: res.data}
    });

    
