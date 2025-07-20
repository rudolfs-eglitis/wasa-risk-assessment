const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf-node');

function generateHtml(assessment) {
    return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { font-size: 24px; margin-bottom: 10px; }
        h2 { font-size: 18px; margin-top: 30px; }
        img.logo { width: 150px; margin-bottom: 20px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 6px; }
        p { margin: 6px 0; }
      </style>
    </head>
    <body>
      <h1>Wasa Trädfällning Risk Assessment #${assessment.id}</h1>

      <p><strong>Date:</strong> ${new Date(assessment.created_at).toLocaleString()}</p>
      <p><strong>Created by:</strong> ${assessment.created_by_name}</p>
      <p><strong>Team leader:</strong> ${assessment.team_leader_name || 'N/A'}</p>
      <p><strong>Job site address:</strong> ${assessment.job_site_address}</p>
      <p><strong>Coordinates:</strong> ${assessment.job_site_lat || ''}, ${assessment.job_site_lng || ''}</p>

      <p><strong>Nearest hospital:</strong> ${assessment.nearest_hospital_name || 'N/A'} (${assessment.nearest_hospital_address || 'N/A'})</p>
      <p><strong>Hospital phone:</strong> ${assessment.nearest_hospital_phone || 'N/A'}</p>

      <p><strong>Car key & First Aid location:</strong> ${assessment.car_key_location || 'Not specified'}</p>

<h2>Crew</h2>
<ul>
  ${
        Array.isArray(assessment.on_site_arborists) && assessment.on_site_arborists.length > 0
            ? assessment.on_site_arborists.map(arborist => `<li>${arborist}</li>`).join('')
            : '<li>No crew listed</li>'
    }
</ul>


      <h2>Methods of Work</h2>
      <ul>
        ${(assessment.methods_of_work || []).map(method => `<li>${method}</li>`).join('') || '<li>No methods listed</li>'}
      </ul>

      <h2>Tree Risks & Mitigations</h2>
      <ul>
        ${assessment.tree_conditions?.map(c =>
        `<li><strong>${c.name}:</strong> ${c.mitigations?.map(m => m.name).join(', ') || 'No mitigations listed'}</li>`
    ).join('') || '<li>No tree risks specified</li>'}
      </ul>

      <h2>Location Risks & Mitigations</h2>
      <ul>
        ${assessment.location_conditions?.map(c =>
        `<li><strong>${c.name}:</strong> ${c.mitigations?.map(m => m.name).join(', ') || 'No mitigations listed'}</li>`
    ).join('') || '<li>No location risks specified</li>'}
      </ul>

      <h2>Weather Risks & Mitigations</h2>
      <ul>
        ${assessment.weather_conditions_details?.map(c =>
        `<li><strong>${c.name}:</strong> ${c.mitigations?.map(m => m.name).join(', ') || 'No mitigations listed'}</li>`
    ).join('') || '<li>No weather risks specified</li>'}
      </ul>

      <h2>Additional Risks</h2>
      <p>${assessment.additional_risks || 'None listed'}</p>

      <h2>Work Plan Confirmation</h2>
      <p><strong>All members of the crew are aware of the work plan, have appropriate PPE, and work can be carried out safely:</strong>
      ${assessment.safety_confirmation ? 'Yes' : 'No'}</p>
    </body>
  </html>`;
}


const generateAssessmentPdf = async (assessment) => {
    const html = generateHtml(assessment);
    const file = { content: html };

    const pdfBuffer = await pdf.generatePdf(file, { format: 'A4' });
    return pdfBuffer;
};

module.exports = generateAssessmentPdf;
