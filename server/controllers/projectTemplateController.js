import ProjectTemplate from '../models/ProjectTemplate.js';

export const createProjectTemplate = async (req, res) => {
  try {
    const { name, description, category, skills, budget } = req.body;

    const projectTemplate = new ProjectTemplate({
      name,
      description,
      category,
      skills,
      budget
    });

    await projectTemplate.save();
    res.status(201).json({ message: 'Project template created successfully', projectTemplate });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProjectTemplates = async (req, res) => {
  try {
    const projectTemplates = await ProjectTemplate.find();
    res.json(projectTemplates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProjectTemplate = async (req, res) => {
  try {
    const projectTemplate = await ProjectTemplate.findById(req.params.id);
    if (!projectTemplate) {
      return res.status(404).json({ message: 'Project template not found' });
    }
    res.json(projectTemplate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProjectTemplate = async (req, res) => {
  try {
    const { name, description, category, skills, budget } = req.body;
    const projectTemplate = await ProjectTemplate.findByIdAndUpdate(
      req.params.id,
      { name, description, category, skills, budget },
      { new: true }
    );
    if (!projectTemplate) {
      return res.status(404).json({ message: 'Project template not found' });
    }
    res.json({ message: 'Project template updated successfully', projectTemplate });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteProjectTemplate = async (req, res) => {
  try {
    const projectTemplate = await ProjectTemplate.findByIdAndDelete(req.params.id);
    if (!projectTemplate) {
      return res.status(404).json({ message: 'Project template not found' });
    }
    res.json({ message: 'Project template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
