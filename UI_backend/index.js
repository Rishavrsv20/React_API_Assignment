import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import cors from "cors";


const app= express();
const port = 4000;



const db = new pg.Client({
    user: 'postgres',      
    host: 'localhost',            
    database: 'world',    
    password: 'PATHAKRISHAV',     
    port: 5432,                   
  });

  db.connect();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));























// Wrapping everything inside an async function
async function createAndFetchData() {
  try {
    // Create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS APIdata (   
        id INT PRIMARY KEY,
        title TEXT,
        price FLOAT,
        description TEXT,
        category TEXT,
        image TEXT,
        sold BOOLEAN,
        dateOfSale TEXT
      )
    `);
    console.log("Table created successfully or already exists");

    // Wait before checking rows to simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch rows from the table
    await checkrows();

  } catch (error) {
    console.error("Error executing query:", error.stack);
  } finally {
    // End the database connection gracefully
    //await db.end();
    console.log("Database connection closed");
  }
}

// Function to check rows in the table
async function checkrows() {
  try {
    const result = await db.query("SELECT * FROM APIdata");
    //console.log("Rows in APIdata:", result.rows.length);  
    if (result.rows.length === 0) {
        console.log("No rows found. Inserting default data...");
        await setData();

    }



  } catch (error) {
    console.error("Error fetching data:", error.stack);
  }
}

// Calling the function createAndFetchData to create table if it does not exists or to check if table is empty then only insert data from API
createAndFetchData();


//API no 1
//Create an API to list the all transactions
// based on parameters like month,price,description etc
app.get("/Product", async (request, response) => {
    //response.send("hello there");
    
    try {
      const { month = 1, search_q = "", page = 1 } = request.query;
      //console.log(request.query);
  
      const query = `
      SELECT * 
      FROM APIdata
      WHERE EXTRACT(MONTH FROM TO_DATE(dateOfSale, 'YYYY-MM-DD')) = $1
        AND (title ILIKE $2 
             OR CAST(price AS TEXT) ILIKE $2 
             OR description ILIKE $2)
      LIMIT 10
      OFFSET $3
    `;
    
    const values = [
      month,                             // $1: the month
      `%${search_q}%`,                   // $2: the search term
      (page - 1) * 10                    // $3: the OFFSET for pagination
    ];
    
  
      const res = await db.query(query,values);
      response.send(res.rows);
    } catch (error) {
      response.status(400).json(error.message);
    }
  });



  //API no 2
  //Create an API for statistics
  app.get("/ForStatistics", async (request, response) => {
    try {
      const { month = 3 } = request.query;
      const query = `
      SELECT 
      SUM(
        CASE 
            WHEN sold = TRUE THEN price 
        END 
      ) AS sales,
      CAST(
        COUNT(
            CASE 
                WHEN sold = TRUE THEN price 
            END
        ) AS INT
      ) AS "soldItems",
      CAST(
        COUNT(
            CASE 
                WHEN sold <> TRUE THEN price 
            END
        ) AS INT
    ) AS "unSoldItems"
FROM APIdata 
WHERE EXTRACT(MONTH FROM TO_DATE(dateOfSale, 'YYYY-MM-DD')) = $1;
 `;
  const result1 = await db.query(query, [month]);
  //console.log(result1.rows[0]);
  
      response.send(result1.rows[0]);
    } catch (error) {
      response.status(400).json(error.message);
    }
  });


  //API no 3
  //Create an API for bar chart ( the response should contain price range and the number
  //of items in that range for the selected month regardless of the year )
  app.get("/BarChartData", async (request, response) => {
    try {
      const { month=3 } = request.query;
      const query = `
      SELECT 
        COUNT(CASE WHEN (price >= 0 AND price <= 100) THEN 1 END) AS "0-100",
        COUNT(CASE WHEN (price >= 101 AND price <= 200) THEN 1 END) AS "101-200",
        COUNT(CASE WHEN (price >= 201 AND price <= 300) THEN 1 END) AS "201-300",
        COUNT(CASE WHEN (price >= 301 AND price <= 400) THEN 1 END) AS "301-400",
        COUNT(CASE WHEN (price >= 401 AND price <= 500) THEN 1 END) AS "401-500",
        COUNT(CASE WHEN (price >= 501 AND price <= 600) THEN 1 END) AS "501-600",
        COUNT(CASE WHEN (price >= 601 AND price <= 700) THEN 1 END) AS "601-700",
        COUNT(CASE WHEN (price >= 701 AND price <= 800) THEN 1 END) AS "701-800",
        COUNT(CASE WHEN (price >= 801 AND price <= 900) THEN 1 END) AS "801-900",
        COUNT(CASE WHEN (price >= 901) THEN 1 END) AS "901-above"
        FROM APIdata
        WHERE EXTRACT(MONTH FROM TO_DATE(dateOfSale, 'YYYY-MM-DD')) = $1;
  `;
  
      const result3 = await db.query(query,[month]);
      const temp =result3.rows[0];

      const formattedData = Object.keys(temp).reduce((acc, key) => {
        acc[key] = Number(temp[key]); // Convert the string value to a number
        return acc;
      }, {});
      //console.log(formattedData);
      response.status(200).json(formattedData);
      //response.status(200).json(result3.rows[0]);
    } catch (error) {
      response.status(400).json(error.message);
    }
  });

//API no. 4
//Create an API for pie chart Find unique categories and number of items from that
//category for the selected month regardless of the year.

app.get("/APIforPieChart", async (request, response) => {
    try {
      const { month = 3 } = request.query;
      const query = `
              SELECT 
                  category, CAST(COUNT(category) AS INT) AS items
              FROM APIdata
              WHERE EXTRACT(MONTH FROM TO_DATE(dateOfSale, 'YYYY-MM-DD')) = $1 
              GROUP BY category;
          `;
      const result4 = await db.query(query,[month]);
      response.status(200).json(result4.rows);
    } catch (error) {
      response.status(400).json(error.message);
    }
  });



  //API no. 5
  //Create an API which fetches the data from all the 3 APIs mentioned above, combines
  //the response and sends a final response of the combined JSON


  const monthNames = {
    1: "January",
    2: "Febrary",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };

  const URL_API="http://localhost:4000";
  
  app.get("/CombinedAPIresult", async (request, response) => {
    try {
      const { month = 3 } = request.query;
  
      const API_1_Response = await axios.get(
        `${URL_API}/ForStatistics?month=${month}`
      );
      const API_1_data = await API_1_Response.data;
      //console.log(API_1_data);
      //response.status(200).json(API_1_data);
  
      const API_2_Response = await axios.get(
        `${URL_API}/BarChartData?month=${month}`
      );
      const API_2_data = await API_2_Response.data;
      //response.status(200).json(API_2_data);
  
  
      const API_3_Response = await axios.get(
        `${URL_API}/APIforPieChart?month=${month}`
      );
      const API_3_data = await API_3_Response.data;
      //response.status(200).json(API_3_data);
  
      response.status(200).json({
        monthName: monthNames[month],
        statistics: API_1_data,
        itemPriceRange: API_2_data,
        categories: API_3_data,
      });
    } catch (error) {
      response.status(400).json(error.message);
    }
  });






    // COUNT(*) FILTER (WHERE price >= 0 AND price <= 100) AS "0-100",
          // COUNT(*) FILTER (WHERE price >= 101 AND price <= 200) AS "101-200",
          // COUNT(*) FILTER (WHERE price >= 201 AND price <= 300) AS "201-300",
          // COUNT(*) FILTER (WHERE price >= 301 AND price <= 400) AS "301-400",
          // COUNT(*) FILTER (WHERE price >= 401 AND price <= 500) AS "401-500",
          // COUNT(*) FILTER (WHERE price >= 501 AND price <= 600) AS "501-600",
          // COUNT(*) FILTER (WHERE price >= 601 AND price <= 700) AS "601-700",
          // COUNT(*) FILTER (WHERE price >= 701 AND price <= 800) AS "701-800",
          // COUNT(*) FILTER (WHERE price >= 801 AND price <= 900) AS "801-900",
          // COUNT(*) FILTER (WHERE price >= 901) AS "901-above"


  









 


  
































    async function setData() {
        
         try {
            const response = await axios.get("https://s3.amazonaws.com/roxiler.com/product_transaction.json");
            const data = response.data;
         
          for (let item of data) {
           
            const {
               id,
               title,
               price,
               description,
               category,
               image,
               sold,
               dateOfSale,
             } = item;
             
             
            await db.query(`
              INSERT INTO APIdata VALUES 
              ($1, $2, $3, $4, $5, $6, $7, $8
                    
                )`,[id, title,price,description,category,image,sold,dateOfSale]);
            
          } 
          
         } catch (error) {
          console.log(error.message);
         }
      };



app.listen(4000, () => {
    console.log(`server running on port ${port}`);
});









