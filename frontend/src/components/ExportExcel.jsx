import React from "react";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { Button } from "@chakra-ui/react";
const ExportExcel = ({ fileName, data }) => {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    if (data.length > 0) {
      const columns = Object.keys(data[0]).map((key) => ({
        header: key.charAt(0).toUpperCase() + key.slice(1),
        key: key,
        width: 20,
      }));
      worksheet.columns = columns;

      data.forEach((row) => worksheet.addRow(row));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName || "download.xlsx");
  };

  return <Button colorScheme="black" colorPalette={"cyan"} mb={5} mt={5} onClick={exportToExcel}>Export to Excel</Button>;
};

export default ExportExcel;
