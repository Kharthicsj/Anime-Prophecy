import Theme from '../models/Theme.js';

// Get all themes
export const getThemes = async (req, res) => {
    try {
        const themes = await Theme.find({});
        res.status(200).json({ success: true, data: themes });
    } catch (error) {
        console.error('Error fetching themes:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create or update a theme
export const saveTheme = async (req, res) => {
    try {
        const { tagType, tag, backgroundColor, textColor, borderColor, buttonColor, priceColor, categoryBgColor, categoryTextColor, subCategoryBgColor, subCategoryTextColor } = req.body;
        if (!tagType || !tag) {
            return res.status(400).json({ success: false, message: 'tagType and tag are required' });
        }

        const theme = await Theme.findOneAndUpdate(
            { tagType, tag },
            { backgroundColor, textColor, borderColor, buttonColor, priceColor, categoryBgColor, categoryTextColor, subCategoryBgColor, subCategoryTextColor },
            { new: true, upsert: true } // Create if doesn't exist, else update
        );

        res.status(200).json({ success: true, data: theme });
    } catch (error) {
        console.error('Error saving theme:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a theme
export const deleteTheme = async (req, res) => {
    try {
        const { id } = req.params;
        const theme = await Theme.findByIdAndDelete(id);
        if (!theme) {
            return res.status(404).json({ success: false, message: 'Theme not found' });
        }
        res.status(200).json({ success: true, message: 'Theme deleted successfully' });
    } catch (error) {
        console.error('Error deleting theme:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
