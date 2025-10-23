// lib/sanity.js  (plain JS module used by the Next app)
import { createClient } from '@sanity/client';

export const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: process.env.SANITY_API_VERSION,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

export const q_active_people = `
  *[_type=="person" && active==true]|order(fullName asc){
    _id, fullName, initials, color, location
  }
`;

export const q_equipment_all = `
  *[_type=="equipment" && active==true]|order(name asc){
    _id, name, assetNumber, serialNumber, calibrationDueAt
  }
`;

export const q_bookings_for_equipment_month = `
  *[_type=="booking" && references($eqId) && (
    startDate <= $monthEnd && endDate >= $monthStart
  )]{
    _id, startDate, endDate, note,
    person->{ _id, fullName, initials, color, location }
  }
`;

export const q_bookings_for_month_all_equipment = `
  *[_type=="booking" && (
    startDate <= $monthEnd && endDate >= $monthStart
  )]{
    _id, startDate, endDate,
    equipment->{ _id, name },
    person->{ _id, initials, color }
  }
`;

// Rows for report (flattened props so we can sort easily)
export const q_report_rows = `
  *[_type=="booking" && startDate <= $end && endDate >= $start]{
    _id,
    startDate,
    endDate,
    note,
    "personName": person->fullName,
    "equipmentId": equipment->_id,
    "equipmentName": equipment->name,
    "assetNumber": equipment->assetNumber
  } | order(assetNumber asc, startDate asc)
`;


