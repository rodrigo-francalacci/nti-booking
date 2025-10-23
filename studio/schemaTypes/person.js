export default {
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    { name: 'fullName', type: 'string', validation: Rule => Rule.required() },
    { name: 'initials', type: 'string', validation: Rule => Rule.required().min(2).max(3) },
    { name: 'color', type: 'string', description: 'Hex or CSS color, e.g. #ff5544' },
    { name: 'location', type: 'string' },
    { name: 'active', type: 'boolean', initialValue: true }
  ]
};
