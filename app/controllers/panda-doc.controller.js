require('dotenv').config();
const axios = require('axios');

function pandaDocController() {
    
    this.sendPandaDocument = async function (req, res) {
        try {
            const { cleanerName, cleanerEmail, templateId } = req.body;

            if (!cleanerName || !cleanerEmail || !templateId) {
                return res.status(400).json({ error: 'Cleaner name, email, and template ID are required' });
            }
        
            const apiKey = process.env.PANDA_DOC_API_KEY;
            const pandaDocUrl = 'https://api.pandadoc.com/public/v1/documents';
        
            try {
                const response = await axios.post(
                    pandaDocUrl,
                    {
                        name: 'Document for ' + cleanerName,
                        template_uuid: templateId,
                        recipients: [
                            {
                                email: cleanerEmail,
                                first_name: cleanerName,
                                role: 'signer',  // The role assigned in the PandaDoc template
                            }
                        ],
                        tokens: [],
                    },
                    {
                        headers: {
                            Authorization: `API-Key ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
        
                res.status(200).json({
                    message: 'Document sent successfully!',
                    documentId: response.data.id,
                });
            } catch (error) {
                console.error('Error sending document:', error.response?.data || error.message);
                res.status(500).json({ error: 'Failed to send document', });
            }
        
        } catch (err) {
            // If there's an error in sending the email, return an error response
            res.status(500).json({ message: 'Error:', error: err.message });
        }
    }

    this.getPandaTemplates = async function (req, res) {
        try {
            const apiKey = process.env.PANDA_DOC_API_KEY;
            const response = await axios.get('https://api.pandadoc.com/public/v1/templates', {
                headers: {
                    Authorization: `API-Key ${apiKey}`,
                },
            });

            res.status(200).json(response.data);
    
        } catch (error) {
            console.error('Error fetching templates:', error.response?.data || error.message);
            res.status(500).json({ message: 'Error:', error: err.message });
        }
    };

}

module.exports = new pandaDocController();