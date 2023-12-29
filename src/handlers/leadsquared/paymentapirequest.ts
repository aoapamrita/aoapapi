const axios = require('axios');
//import axios from 'axios'
import { Prisma } from "@prisma/client";
import prisma from "../../db";

export async function invokepaymentAPI(req, res) {

  const candate = req.candid;

  const candidatecheck = await prisma.lSQ.findUnique({
    where: {
        candidateId: candate,
    },
});

if(candidatecheck){

const currentDatetime = new Date();

          const formattedDateTime = `${currentDatetime.getFullYear()}-${padZero(currentDatetime.getMonth() + 1)}-${padZero(currentDatetime.getDate())} ${padZero(currentDatetime.getHours())}:${padZero(currentDatetime.getMinutes())}:${padZero(currentDatetime.getSeconds())}`;


  const apiUrl =
      'https://api-in21.leadsquared.com/v2/ProspectActivity.svc/Create?accessKey=u$rf48bd02912265b541feee4c981024107&secretKey=177a8e18aed6c8494b76efb863677ddd3b5353df';
  
    const postData = {
      RelatedProspectId: candidatecheck.relatedId,
      ActivityEvent: 209,
      ActivityNote: 'AOAP',
      ProcessFilesAsync: true,
      ActivityDateTime: formattedDateTime,
      Fields: [
        {
          SchemaName: 'mx_Custom_1',
          Value: req.section,
        },
        {
          SchemaName: 'mx_Custom_3',
          Value: 'B.Tech',
        },
        {
          SchemaName: 'mx_Custom_5',
          Value: req.paystatus,
        },
      ],
    };
  
    // Set the request headers
    const headers = {
      'Content-Type': 'application/json',
    };
  
    try {
      // Make the POST request using axios
      const response = await axios.post(apiUrl, postData, { headers });
  
      // Output the API response
      const relatedId = candidatecheck.relatedId;
      const candid = candidatecheck.candidateId;
  
      const data = {
        candid,
        relatedId,
      };

      
      // return res.json(lsqresponse);
    //  return res.json(response.data);
    } catch (error) {
      // Handle errors
      console.error('Error:', error.message || error);
     // return res.json(req.paystatus);
    }
  }
};




  export async function PostpaymentActivity(req, res) {
    const apiUrl =
      'https://api-in21.leadsquared.com/v2/ProspectActivity.svc/Create?accessKey=u$rf48bd02912265b541feee4c981024107&secretKey=177a8e18aed6c8494b76efb863677ddd3b5353df';
  
    const postData = {
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
  