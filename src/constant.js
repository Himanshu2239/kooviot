export const DB_NAME = "youtube";
export const MAX_LIMIT_OF_DATA = "15000kb";
export const STORE_STATIC_DATA = "public";
export const APPLICATION_ROLE = ["admin", "salesperson", "production"];
export const DOCUMENT_TYPE = [
  "glovesProduction",
  "fgStocks",
  "dispatchDetails",
  "productionReport",
];
export const USER_TYPE_PLAYER = "salesperson";
export const USER_TYPE_PRODUCTION = "production";
export const USER_TYPE_ADMIN = "admin";


export const salesPersons = [
  { id: "SP001", name: "Ravikumar N", jobId: "KIOL2238", area: "Bangalore" },
  { id: "SP002", name: "Sugumar R", jobId: "KIOL2236", area: "Chennai, TN" },
  { id: "SP003", name: "Vineesh Mehta", jobId: "KIOL2239", area: "Delhi" },
  {
    id: "SP004",
    name: "Soma Naveen Chandra",
    jobId: "KIOL2070",
    area: "Hyderabad",
  },
  {
    id: "SP005",
    name: "Bharat Lal Dubey",
    jobId: "KIOL2064",
    area: "Maharashtra",
  },
  { id: "SP006", name: "Sushila Shaw", jobId: "KIOL2225", area: "Kolkata" },
  { id: "SP007", name: "Ardhendu Aditya", jobId: "KIOL2234", area: "Kolkata" },
  { id: "SP008", name: "Yogesh Lahoti", jobId: "KIOL2049", area: "Pan India" },
  { id: "SP009", name: "Krishnamoorthi", jobId: "KIOL2243", area: "Singapore" },
  { id: "SP010", name: "others", jobId: "others", area: "Pan India" },
  
  
];

// Extract jobIds for export

export const jobIds = salesPersons.map((person) => person.jobId);

export const PRODUCTION_JOBID = "production";
