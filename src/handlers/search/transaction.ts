import prisma from "../../db";

export const searchTransactionById = async (req, res) => {

    const  {transactionId} = req.body;

    const transactionDetails = await prisma.entrancePayments.findMany({
      where: {
        txnid: {
          equals: transactionId, 
        },
    },
      include: {
        candidate: true,
        examapplication: {
            include: {
              exam: true,
              Registration: {
                select: {
                  registrationNo: true
                }
              },
              EntrancePayments: true,
            },
          },
      },
    });

    return res.json(transactionDetails);
};