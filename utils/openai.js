const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateProjectBrief = async (projectDescription) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert project manager. Generate a detailed professional project brief including scope, deliverables, timeline estimate, and budget range.',
        },
        {
          role: 'user',
          content: `Create a brief for this project: ${projectDescription}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating brief:', error);
    throw error;
  }
};

const generateMatchingScore = async (freelancerProfile, projectDetails) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert recruiter. Analyze compatibility between freelancer profile and project requirements. Return ONLY a number between 0-100 representing the match percentage.',
        },
        {
          role: 'user',
          content: `Freelancer: ${JSON.stringify(freelancerProfile)}\n\nProject: ${JSON.stringify(projectDetails)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 10,
    });

    const score = parseInt(response.choices[0].message.content);
    return isNaN(score) ? 0 : Math.min(100, Math.max(0, score));
  } catch (error) {
    console.error('Error generating matching score:', error);
    throw error;
  }
};

const generateProposal = async (freelancerProfile, projectDetails) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an experienced freelancer. Write a compelling, professional project proposal. Keep it concise but detailed.',
        },
        {
          role: 'user',
          content: `Write a proposal for this project:\n\nFreelancer: ${JSON.stringify(freelancerProfile)}\n\nProject: ${JSON.stringify(projectDetails)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating proposal:', error);
    throw error;
  }
};

module.exports = {
  generateProjectBrief,
  generateMatchingScore,
  generateProposal,
};