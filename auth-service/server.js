const express = require("express");
const path = require('path');
const {PrismaClient} = require("@prisma/client");
const { PrismaLibSql } = require('@prisma/adapter-libsql'); // Changed: lowercase 'ql'
const { createClient } = require('@libsql/client');  
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}
const app = express();

console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');

// connection and the adapter
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaLibSql({url:dbUrl});

const prisma = new PrismaClient({ adapter});


prisma.$connect().then(()=>console.log("successfully connected to the db"))
.catch((e)=>console.error("database connection failed:",e));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

// creatin the company and first user
app.post(['/auth/register','/register'],async(req,res)=>{
    try{
        const {email, password, companyName} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const company = await prisma.company.create({
            data:{
                name: companyName,
                users:{
                    create:{
                        email,
                        password:hashedPassword
                    }
                }
            }
        });
        res.status(201).json({message:"company and user registered successfully"});
    }catch(err){
        console.error(err);
        res.status(400).json({error:err.message, code:err.code});
    }
});

// login - (returns the jwt token with user_id and company_id)
app.post(['/auth/login','/login'],async(req, res)=>{
    try{
        const {email, password} = req.body;
        const user = await prisma.user.findUnique({
            where:{email}
        });

        if(!user || !(await bcrypt.compare(password, user.password))){
            return res.status(401).json({error:"invalid email or password"});
        }

        // creating the jwt payload
        const token = jwt.sign(
            {user_id:user.id, company_id:user.company_id, role:"admin"},
            JWT_SECRET,
            {expiresIn:'24h'}
        );

        res.json({token});
    }catch(err){
        res.status(500).json({error:"internal server error"});
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, ()=>console.log(`Auth service running on port ${PORT}`));