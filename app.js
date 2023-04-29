const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`Error msg: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbDistObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertDbStateObjectToObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//get all states
app.get("/states/", async (request, response) => {
  const getAllStates = `SELECT * FROM state ORDER BY state_id;`;
  const statesArray = await db.all(getAllStates);

  response.send(
    statesArray.map((eachState) => convertDbStateObjectToObject(eachState))
  );
});

//get state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `
    SELECT * FROM state WHERE state_id = ${stateId};`;
  const dbresponse = await db.get(getState);
  response.send(convertDbStateObjectToObject(dbresponse));
});

// Add district
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrict = `
    INSERT INTO district 
    (district_name, state_id, cases, cured, active, deaths)
    VALUES
    (
       "${districtName}",
       "${stateId}",
       "${cases}",
       "${cured}",
       "${active}",
       "${deaths}"
    );`;

  const dbresponse = await db.run(addDistrict);
  const districtId = dbresponse.lastID;
  response.send("District Successfully Added");
});

//get district
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT * FROM district WHERE district_id = ${districtId};`;

  const dbresponse = await db.get(getDistrict);
  response.send(convertDbDistObjectToResponseObject(dbresponse));
});

//Delete District
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  const dbresponse = await db.get(deleteDistrict);
  response.send("District Removed");
});

// update district
app.put("/districts/:districtId/", async (request, response) => {
  const districtDetails = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = `
    UPDATE district SET 
        district_name="${districtName}",
        state_id="${stateId}",
        cases="${cases}",
        cured="${cured}",
        active="${active}",
        deaths="${deaths}"
        
        WHERE district_id = ${districtId};`;

  const dbresponse = await db.run(updateDistrict);
  response.send("District Details Updated");
});

//get district
app.get("/districts/", async (request, response) => {
  const getdist = `SELECT * FROM district ORDER BY district_id;`;
  const distArray = await db.all(getdist);

  response.send(
    distArray.map((eachState) => convertDbDistObjectToResponseObject(eachState))
  );
});

//get movie directorname
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStateStatsQuery = `
    SELECT SUM(cases),SUM(cured),SUM(active),
    SUM(deaths)
    FROM district 
    WHERE state_id = ${stateId};`;

  const stats = await db.get(getStateStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
SELECT state_id from district
WHERE district_id = ${districtId};
`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
SELECT state_name as stateName from state
WHERE state_id = ${getDistrictIdQueryResponse.state_id};
`;

  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
