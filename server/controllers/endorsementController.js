import Profile from '../models/Profile.js';

export const addSkillEndorsement = async (req, res) => {
  try {
    const { skill } = req.body;
    const freelancerId = req.params.id;
    const endorser = req.user.userId;

    const profile = await Profile.findOne({ user: freelancerId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const existingEndorsement = profile.skillEndorsements.find(
      (endorsement) => endorsement.skill === skill && endorsement.endorser.toString() === endorser
    );

    if (existingEndorsement) {
      return res.status(400).json({ message: 'You have already endorsed this skill' });
    }

    profile.skillEndorsements.push({ skill, endorser });
    await profile.save();
    res.json({ message: 'Skill endorsed successfully', profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSkillEndorsements = async (req, res) => {
  try {
    const freelancerId = req.params.id;
    const profile = await Profile.findOne({ user: freelancerId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile.skillEndorsements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSkillEndorsement = async (req, res) => {
  try {
    const { skill } = req.body;
    const freelancerId = req.params.id;
    const endorser = req.user.userId;

    const profile = await Profile.findOne({ user: freelancerId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.skillEndorsements = profile.skillEndorsements.filter(
      (endorsement) => !(endorsement.skill === skill && endorsement.endorser.toString() === endorser)
    );

    await profile.save();
    res.json({ message: 'Skill endorsement removed successfully', profile });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
