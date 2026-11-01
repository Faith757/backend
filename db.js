require('dotenv').config();
const mongoose = require('mongoose');
async function connectdb(){
    try{
      await mongoose.connect(process.env.MONGODB_URL);
      console.log("database connected");
    }catch(error){
        console.error("Error connecting to database", error);
        process.exit(1);
    }
}
module.exports = connectdb;