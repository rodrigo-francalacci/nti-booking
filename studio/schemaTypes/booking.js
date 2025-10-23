export default {
  name: 'booking',
  title: 'Booking',
  type: 'document',
  fields: [
    { name: 'equipment', type: 'reference', to: [{ type: 'equipment' }], validation: Rule => Rule.required() },
    { name: 'person', type: 'reference', to: [{ type: 'person' }], validation: Rule => Rule.required() },
    { name: 'startDate', type: 'date', validation: Rule => Rule.required() },
    { name: 'endDate', type: 'date', validation: Rule => Rule.required() },
    { name: 'note', type: 'string' }
  ]
};
