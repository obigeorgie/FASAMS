export const generateFasamsXML = (validRows) => {
    // 1. Define the Standard DCF XML Header (Source [4])
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<ClientDataSet xmlns="http://www.myflfamilies.com/fasams/client/v14" 
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:schemaLocation="http://www.myflfamilies.com/fasams/client/v14 ClientDataSet.xsd">
  <SourceSystem>
    <SystemID>YOUR_VENDOR_ID</SystemID>
    <SubmitterID>YOUR_SUBMITTER_ID</SubmitterID>
  </SourceSystem>
  <Clients>`;

    // 2. Map Flat JSON to Hierarchical XML Nodes
    const clientNodes = validRows.map(row => {
        return `    <Client>
      <BaseData>
        <SSN>${row.SSN}</SSN>
        <MedicaidID>${row.Medicaid_ID || ''}</MedicaidID>
        <InternalClientID>${row.Client_ID || 'MISSING'}</InternalClientID>
        <DOB>${row.DOB}</DOB>
        <Sex>${row.Sex}</Sex>
      </BaseData>
      <Admission>
        <AdmissionDate>${row.Admission_Date}</AdmissionDate>
        <ProjectCode>${row.Project_Code}</ProjectCode>
        <SiteID>${row.Provider_ID}</SiteID>
        <Diagnosis>
          <ICD10>${row.Diagnosis_Code_ICD10}</ICD10>
        </Diagnosis>
      </Admission>
    </Client>`;
    }).join('\n');

    const xmlFooter = `  </Clients>
</ClientDataSet>`;

    return xmlHeader + '\n' + clientNodes + '\n' + xmlFooter;
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
