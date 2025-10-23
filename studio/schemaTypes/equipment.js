export default {
  name: 'equipment',
  title: 'Equipment',
  type: 'document',
  fields: [
    { name: 'name', type: 'string', validation: Rule => Rule.required() },
    { name: 'assetNumber', type: 'string' },
    { name: 'serialNumber', type: 'string' },
    { name: 'calibrationDueAt', type: 'date', options: { dateFormat: 'YYYY-MM-DD' } },
    { name: 'active', type: 'boolean', initialValue: true }
  ]
};
