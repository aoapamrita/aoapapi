import AdmZip from "adm-zip";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";

export const handleOmrUpload = (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // The name 'file' below should match the name attribute in your HTML form
  let uploadedFile = req.files.file;
  let uploadbasefolder = "./uploads/";
  let extractedbasefolder = "extracted/";

  let uploadfoldername = `omr_${Date.now()}`;

  let uploadfilepath = `${uploadbasefolder}/${uploadfoldername}.zip`;
  let extractedfoldername = `extracted/${uploadfoldername}`;
  // Use the mv() method to place the file in upload directory
  uploadedFile.mv(uploadfilepath, function (err) {
    if (err) return res.status(500).send(err);

    // Extract the ZIP file
    const zip = new AdmZip(uploadfilepath);
    zip.extractAllTo(extractedfoldername, true);

    const extractedDir = fs
      .readdirSync(extractedfoldername, { withFileTypes: true })
      .find((dir) => dir.isDirectory()).name;

    const excelFiles = fs
      .readdirSync(extractedfoldername)
      .filter((file) => file.endsWith(".xlsx") || file.endsWith(".xls"));

    if (excelFiles.length === 0) {
      return res.status(400).send("No Excel files found in the ZIP.");
    }

    const workbook = xlsx.readFile(
      path.join(extractedfoldername, excelFiles[0])
    );
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const files = data.map((row) => {
      const applno = row["Appl_no"];
      const photopath = `${extractedfoldername}/${extractedDir}/${applno}_photo.jpg`;
      const signpath = `${extractedfoldername}/${extractedDir}/${applno}_sign.jpg`;

      return { applno, photopath, signpath };
    });

    res.send(files);
  });
};
