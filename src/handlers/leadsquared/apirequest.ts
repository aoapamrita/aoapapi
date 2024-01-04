const axios = require('axios');
//import axios from 'axios'
import { Prisma } from "@prisma/client";
import prisma from "../../db";

export async function invokeAPI(req,res) {

    const candate = req.body.candid
    const candidatecheck = await prisma.lSQ.findUnique({
        where: {
            candidateId: candate,
        },
      });

      if(req.body.section == 'App Fee Payment' || req.body.section == 'Application Initiated'){

        const relatedId = candidatecheck.relatedId;
        const candid = candidatecheck.candidateId;
       
       
const currentDatetime = new Date();
  
// Format the date and time with a custom format
const formattedDateTime = `${currentDatetime.getFullYear()}-${padZero(currentDatetime.getMonth() + 1)}-${padZero(currentDatetime.getDate())} ${padZero(currentDatetime.getHours())}:${padZero(currentDatetime.getMinutes())}:${padZero(currentDatetime.getSeconds())}`;

// Format the date and time as a string

         //const date = '2023-12-15 12:13:44';
         const date = formattedDateTime;
          const mx_Custom_1 = req.body.section;
          const mx_Custom_5 = req.body.paystatus;
          const mx_Custom_2 = req.body.source ? req.body.source : "";
        PostActivity({ relatedId: relatedId, date: date, mx_Custom_1: mx_Custom_1, mx_Custom_5: mx_Custom_5, candid: candid, mx_Custom_2: mx_Custom_2},res);
   

      }else{

const apiUrl = 'https://api-in21.leadsquared.com/v2/LeadManagement.svc/Lead.Capture?accessKey=u$rf48bd02912265b541feee4c981024107&secretKey=177a8e18aed6c8494b76efb863677ddd3b5353df';

const postData = [
    {
        "Attribute": "FirstName",
        "Value": req.body.name
    },
    {
        "Attribute": "LastName",
        "Value": ""
    },
    {
        "Attribute": "EmailAddress",
        "Value": req.body.email
    },
    {
        "Attribute": "Phone",
        "Value": req.body.phone
    },
    {
        "Attribute": "Source",
        "Value": req.body.source
    },
    {
        "Attribute": "SearchBy",
        "Value": "EmailAddress"
    }
];


// Set the request headers
const headers = {
    'Content-Type': 'application/json'
};

// Make the POST request using axios
axios.post(apiUrl, postData, { headers })
    .then(response => {
        // Output the API response
        console.log(response.data);

        if(response.data.Status == 'Success'){

        //return res.json(response.data.Message.RelatedId);

        const relatedId = response.data.Message.RelatedId;
        const candid = req.body.candid;
       
       
const currentDatetime = new Date();
  
// Format the date and time with a custom format
const formattedDateTime = `${currentDatetime.getFullYear()}-${padZero(currentDatetime.getMonth() + 1)}-${padZero(currentDatetime.getDate())} ${padZero(currentDatetime.getHours())}:${padZero(currentDatetime.getMinutes())}:${padZero(currentDatetime.getSeconds())}`;


          //const date = '2023-12-15 12:13:44';
          const date = formattedDateTime;
          const mx_Custom_1 = req.body.section;
          const mx_Custom_5 = req.body.paystatus;
          const mx_Custom_2 = req.body.source ? req.body.source : "";
        PostActivity({ relatedId: relatedId, date: date, mx_Custom_1: mx_Custom_1, mx_Custom_5: mx_Custom_5, candid: candid, mx_Custom_2: mx_Custom_2},res);
   
        }
      //return res.json(response.data.Status);




    })
    .catch(error => {
        // Handle errors
        console.error('Error:', error.message || error);
        return res.json(req.body.email);
    });

}

  };

  export async function PostActivity(req, res) {
    const apiUrl =
      'https://api-in21.leadsquared.com/v2/ProspectActivity.svc/Create?accessKey=u$rf48bd02912265b541feee4c981024107&secretKey=177a8e18aed6c8494b76efb863677ddd3b5353df';
 
      let postData;

     // if(req.mx_Custom_1 == 'Personal Details'){
    postData = {
      RelatedProspectId: req.relatedId,
      ActivityEvent: 209,
      ActivityNote: 'AOAP',
      ProcessFilesAsync: true,
      ActivityDateTime: req.date,
      Fields: [
        {
          SchemaName: 'mx_Custom_1',
          Value: req.mx_Custom_1,
        },
        {
          SchemaName: 'mx_Custom_2',
          Value: req.mx_Custom_2,
        },
        {
          SchemaName: 'mx_Custom_3',
          Value: 'B.Tech',
        },
        {
          SchemaName: 'mx_Custom_5',
          Value: req.mx_Custom_5,
        },
      ],
    };
 /* } else{

    postData = {
      RelatedProspectId: req.relatedId,
      ActivityEvent: 209,
      ActivityNote: 'AOAP',
      ProcessFilesAsync: true,
      ActivityDateTime: req.date,
      Fields: [
        {
          SchemaName: 'mx_Custom_1',
          Value: req.mx_Custom_1,
        },
        {
          SchemaName: 'mx_Custom_3',
          Value: 'B.Tech',
        },
        {
          SchemaName: 'mx_Custom_5',
          Value: req.mx_Custom_5,
        },
      ],
    };

  }*/
  
    // Set the request headers
    const headers = {
      'Content-Type': 'application/json',
    };
  
    try {
      // Make the POST request using axios
      const response = await axios.post(apiUrl, postData, { headers });
  
      // Output the API response
      const relatedId = req.relatedId;
      const candid = req.candid;
  
      const data = {
        candid,
        relatedId,
      };

      const candidatecheck = await prisma.lSQ.findUnique({
        where: {
            candidateId: candid,
        },
      });

      if(!candidatecheck){
  
      const lsqresponse = await prisma.lSQ.create({
        data: {
          candidateId: data.candid,
          relatedId: data.relatedId,
        },
      });
    }
   
  
      // return res.json(lsqresponse);
      return res.json(response.data);
    } catch (error) {
      // Handle errors
      console.error('Error:', error.message || error);
      return res.json(req.mx_Custom_5);
    }
  };

  const padZero = (num) => {
  return num.toString().padStart(2, '0');
};
  