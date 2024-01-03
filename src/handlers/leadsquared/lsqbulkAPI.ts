const axios = require('axios');
//import axios from 'axios'
import { Prisma } from "@prisma/client";
import prisma from "../../db";
import { BadRequestError } from "../../errors/bad-request-error";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export async function invokebulkAPI(req, res) {
  try {
    let candidates = [];

    const allCandidates = await prisma.candidate.findMany({
      include: {
        gender: true,
        socialstatus: true,
        infosource: true,
        state: true,
        district: true,
        city: true,
        Onboarding: true,
        ParentInfo: true,
        PlusTwoInfo: {
          include: {
            state: true,
          },
        },
        ExamApplication: {
          include: {
            exam: {
              include: {
                entrance: true,
              },
            },
            Registration: true,
            ApplicationJEE: true,
            ApplicationCities: {
              include: {
                examcity: {
                  include: {
                    city: true,
                  },
                },
              },
            },
          },
        },
        EntrancePayments: true,
        JEEApplication: true,
        JEEPayments: true,
      },
    });

    const batchSize = 40;

    for (let i = 0; i < allCandidates.length; i += batchSize) {
      const currentBatch = allCandidates.slice(i, i + batchSize);

      await Promise.all(
        currentBatch.map(async (row) => {
          let entrance = {
            AEEstatus: null,
          };

          row.ExamApplication.forEach((appln) => {
            if (appln.exam.entrance.code === "AEEE") {
              entrance = {
                ...entrance,
                AEEstatus: appln.status,
              };
            }
          });

          let profstatus = row.Onboarding ? row.Onboarding.status : false;
          let appstatus = entrance.AEEstatus;
          let paymentstatus = row.EntrancePayments;

          let usersection;
          let pay_status;

          if (profstatus == false) {
            usersection = "Registration";
            pay_status = "Unpaid";
          } else if (profstatus == true && appstatus == null) {
            usersection = "Personal Details";
            pay_status = "Unpaid";
          } else if (profstatus == true && appstatus == 'APPLIED' && !paymentstatus.length) {
            usersection = "Application Initiated";
            pay_status = "Unpaid";
          } else if (profstatus == true && appstatus == 'APPLIED' && paymentstatus.length > 0) {
            usersection = "App Fee Payment";
            pay_status = "Paid";
          }

          let candid = row.id;
          let uname = row.fullname ? row.fullname : "";
          let uphone = row.phone ? row.phone : "";
          let email = row.email ? row.email : "";
          let source = row.infosource ? row.infosource.name : "";
          let section = usersection;
          let paystatus = pay_status;

          

          await invokeAPI({ email: email, name: uname, phone: uphone, section: section, paystatus: paystatus, source: source, candid: candid}, res);
        })
      );
    }

    res.status(200).json({ message: 'Data posted successfully' });
  } catch (error) {
    console.error('Error fetching data from the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}

export async function invokeAPI(req, res) {
  try {

  
    const candate = req.candid;
    const apiUrl = 'https://api-in21.leadsquared.com/v2/LeadManagement.svc/Lead.Capture?accessKey=u$rf48bd02912265b541feee4c981024107&secretKey=177a8e18aed6c8494b76efb863677ddd3b5353df';
    const postData = [
      {
          "Attribute": "FirstName",
          "Value": req.name
      },
      {
          "Attribute": "LastName",
          "Value": ""
      },
      {
          "Attribute": "EmailAddress",
          "Value": req.email
      },
      {
          "Attribute": "Phone",
          "Value": req.phone
      },
      {
          "Attribute": "Source",
          "Value": req.source
      },
      {
          "Attribute": "SearchBy",
          "Value": "EmailAddress"
      }
    ];

    const headers = {
      'Content-Type': 'application/json',
    };

  

    const response = await axios.post(apiUrl, postData, { headers });
   

   if (response.data.Status == 'Success') {
      const relatedId = response.data.Message.RelatedId;
      const candid = req.candid;

      const currentDatetime = new Date();
      const formattedDateTime = `${currentDatetime.getFullYear()}-${padZero(currentDatetime.getMonth() + 1)}-${padZero(currentDatetime.getDate())} ${padZero(currentDatetime.getHours())}:${padZero(currentDatetime.getMinutes())}:${padZero(currentDatetime.getSeconds())}`;

      const date = formattedDateTime;
      const mx_Custom_1 = req.section;
      const mx_Custom_5 = req.paystatus;
      const mx_Custom_2 = req.source;
      

     await PostActivity({ relatedId: relatedId, date: date, mx_Custom_1: mx_Custom_1, mx_Custom_5: mx_Custom_5, candid: candid, mx_Custom_2: mx_Custom_2 }, res);
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error) {

    if (error.response && error.response.status === 429) {
      // Implement exponential backoff
      await delay(Math.pow(2, error.response.headers['retry-after'] || 1) * 1000);
      // Retry the request
      await invokeAPI({ email: req.email, name: req.name, phone: req.phone, section: req.section, paystatus: req.paystatus, source: req.source, candid: req.candid}, res);
     
    } else{

    console.error('Error:', error.message || error);
    res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export async function PostActivity(req, res) {
  try {
    const apiUrl = 'https://api-in21.leadsquared.com/v2/ProspectActivity.svc/Create?accessKey=u$rf48bd02912265b541feee4c981024107&secretKey=177a8e18aed6c8494b76efb863677ddd3b5353df';
    let postData;

   
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
 

    const headers = {
      'Content-Type': 'application/json',
    };

    const response = await axios.post(apiUrl, postData, { headers });

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

    if (!candidatecheck) {
      const lsqresponse = await prisma.lSQ.create({
        data: {
          candidateId: data.candid,
          relatedId: data.relatedId,
        },
      });
    }

    //res.json(response.data);
  } catch (error) {

    if (error.response && error.response.status === 429) {
      // Implement exponential backoff
      await delay(Math.pow(2, error.response.headers['retry-after'] || 1) * 1000);
      // Retry the request
      await PostActivity({ relatedId: req.relatedId, date: req.date, mx_Custom_1: req.mx_Custom_1, mx_Custom_5: req.mx_Custom_5, candid: req.candid, mx_Custom_2: req.mx_Custom_2 }, res);
   
    }else{

    console.error('Error:', error.message || error);
    res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

const padZero = (num) => {
  return num.toString().padStart(2, '0'); 
};
