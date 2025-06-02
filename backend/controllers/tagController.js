const tagService = require('../models/tag');

const tagController = {

    // Отримати всі теги
    async getAllTags(req, res) {
        try {
            const tags = await tagService.getAll();
            res.json(tags);
        } catch (error) {
            console.error('Error fetching all tags:', error);
            res.status(500).json({ error: 'Failed to fetch tags' });
        }
    },

    // Отримати тег за ID
    async getTagById(req, res) {
        try {
            const tag = await tagService.getById(req.params.id);
            if (!tag) {
                return res.status(404).json({ error: 'Tag not found' });
            }
            res.json(tag);
        } catch (error) {
            console.error('Error fetching tag by ID:', error);
            res.status(500).json({ error: 'Failed to fetch tag' });
        }
    },

    // Отримати теги за їх типом (Genre або Trope)
    async getTagsByType(req, res) {
        const { type } = req.params;
        if (!type) {
            return res.status(400).json({ error: 'Tag type is required.' });
        }

        try {
            const tags = await tagService.getByType(type);
            res.json(tags);
        } catch (error) {
            console.error('Error fetching tags by type:', error);
            res.status(500).json({ error: 'Failed to fetch tags by type.' });
        }
    },

    //  Пошук тегів за частиною назви
    async searchTags(req, res) {
        const { name } = req.query;
        if (!name || name.length < 2) {
            return res.status(400).json({ error: 'Search term is too short.' });
        }

        try {
            const results = await tagService.searchByName(name);
            res.json(results);
        } catch (error) {
            console.error('Error searching tags:', error);
            res.status(500).json({ error: 'Failed to search tags.' });
        }
    }
};

module.exports = tagController;
