/* global Lists:true */
/* global SimpleSchema Factory faker Denormalizer Todos */


// Not sure where the best spot to put this is
const userIdDenormalizer = new Denormalizer({
  source: () => Lists,
  // TODO - can't depend as will lead to circular dep -- single collections package?
  target: () => Package.todos.Todos,
  field: 'userId',
  foreignKey: 'listId'
});

class ListsCollection extends Mongo.Collection {
  insert(list) {
    if (!list.name) {
      let nextLetter = 'A';
      list.name = `List ${nextLetter}`;

      while (Lists.findOne({name: list.name})) {
        // not going to be too smart here, can go past Z
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
        list.name = `List ${nextLetter}`;
      }
    }

    return super(list);
  }
  update(selector, modifier) {
    userIdDenormalizer.sourceUpdate(selector, modifier);
    super(selector, modifier);
  }
}

Lists = new ListsCollection('Lists');
Lists.userIdDenormalizer = userIdDenormalizer;

Lists.schema = new SimpleSchema({
  name: { type: String },
  incompleteCount: {type: Number, defaultValue: 0},
  userId: { type: String, optional: true }
});

Lists.attachSchema(Lists.schema);

Factory.define('list', Lists, {});

Lists.helpers({
  // A list is considered to be private if it has a userId set
  isPrivate() {
    return !!this.userId;
  },
  isLastPublicList() {
    const publicListCount = Lists.find({userId: {$exists: false}}).count();
    return !this.isPrivate() && publicListCount === 1;
  }
});
