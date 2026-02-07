export const generateFasamsXML = (validRows) => {
  // Official Header based on FASAMS 155-2 Standards
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<ClientDataSet xmlns="http://www.myflfamilies.com/fasams/client/v14"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:schemaLocation="http://www.myflfamilies.com/fasams/client/v14 ClientDataSet.xsd">
  <SourceSystem>
    <VendorID>YOUR_VENDOR_ID</VendorID>
    <SubmitterID>YOUR_SUBMITTER_ID</SubmitterID>
  </SourceSystem>`;

  const clientNodes = validRows.map((row) => {
    return `  <Client>
    <BaseData>
      <SSN>${row.SSN}</SSN>
      <SourceRecordIdentifier>${row.Client_ID || row.SSN}</SourceRecordIdentifier>
    </BaseData>
    <Admission>
      <Date>${row.Admission_Date}</Date>
      <ProjectCode>${row.Project_Code}</ProjectCode>
      <OCA>${row.OCA}</OCA>
      <SiteID>${row.Provider_ID}</SiteID>
    </Admission>
    <Diagnosis>
      <ICD10Code>${row.Diagnosis_Code_ICD10}</ICD10Code>
    </Diagnosis>
  </Client>`;
  }).join('\n');

  return `${xmlHeader}\n${clientNodes}\n</ClientDataSet>`;
};

export const downloadXML = (content, filename = 'fasams_upload.xml') => {
  const blob = new Blob([content], { type: 'text/xml' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
