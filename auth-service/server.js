const express = require("express");
const {PrismaClient} = require("@prisma/client");
const { PrismaLibSql } = require('@prisma/adapter-libsql'); // Changed: lowercase 'ql'
const { createClient } = require('@libsql/client');  
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
// Create the connection and the adapter
const libsql = createClient({
  url: 'file:./prisma/auth.db', // Path to your auth db
});
const adapter = new PrismaLibSql(libsql);

const prisma = new PrismaClient({adapter});
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

// creatin the company and first user
app.post('/auth/register',async(req,res)=>{
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
        res.status(201).json({mesage:"company and user registered successfully"});
    }catch(err){
        console.error(err);
        res.status(400).json({error:"registration dailed. email might existed already"});
    }
});

// login - (returns the jwt token with user_id and company_id)
app.post('/auth/login',async(req, res)=>{
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
            {user_id:user_id, company_id:user.company_id, role:"admin"},
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