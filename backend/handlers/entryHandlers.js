// Entry handlers
const { ObjectId } = require('mongodb');
const { getCollection } = require('../database');
const { parseBody, getPathParam, getQueryParam, successResponse, errorResponse } = require('../helpers');

// Get all entries for user
async function getEntries(event) {
    try {
        const userId = event.user.user_id;
        const tagId = getQueryParam(event, 'tag');
        const favorite = getQueryParam(event, 'favorite');

        // Build query
        const query = { user_id: userId };
        if (tagId) query.tags = tagId;
        if (favorite === 'true') query.is_favorite = true;

        const entries = await getCollection('entries');
        const cursor = entries.find(query).sort({ created_at: -1 });
        const results = await cursor.toArray();

        const formatted = results.map(entry => ({
            _id: entry._id.toString(),
            title: entry.title,
            content: entry.content,
            tags: entry.tags || [],
            is_favorite: entry.is_favorite || false,
            created_at: entry.created_at.toISOString(),
            updated_at: entry.updated_at.toISOString()
        }));

        return successResponse({ entries: formatted });

    } catch (error) {
        console.error('Get entries error:', error);
        return errorResponse('Failed to fetch entries', 500);
    }
}

// Get single entry
async function getEntry(event) {
    try {
        const userId = event.user.user_id;
        const entryId = getPathParam(event, 'id');

        if (!entryId) {
            return errorResponse('Entry ID required');
        }

        const entries = await getCollection('entries');
        const entry = await entries.findOne({
            _id: new ObjectId(entryId),
            user_id: userId
        });

        if (!entry) {
            return errorResponse('Entry not found', 404);
        }

        return successResponse({
            entry: {
                _id: entry._id.toString(),
                title: entry.title,
                content: entry.content,
                tags: entry.tags || [],
                is_favorite: entry.is_favorite || false,
                created_at: entry.created_at.toISOString(),
                updated_at: entry.updated_at.toISOString()
            }
        });

    } catch (error) {
        console.error('Get entry error:', error);
        return errorResponse('Failed to fetch entry', 500);
    }
}

// Create entry
async function createEntry(event) {
    try {
        const userId = event.user.user_id;
        const body = parseBody(event);

        const title = (body.title || '').trim();
        const content = (body.content || '').trim();
        const tags = body.tags || [];
        const isFavorite = body.is_favorite || false;

        if (!title) {
            return errorResponse('Title is required');
        }
        if (!content) {
            return errorResponse('Content is required');
        }

        const now = new Date();
        const entry = {
            user_id: userId,
            title,
            content,
            tags,
            is_favorite: isFavorite,
            created_at: now,
            updated_at: now
        };

        const entries = await getCollection('entries');
        const result = await entries.insertOne(entry);

        return successResponse({
            entry: {
                _id: result.insertedId.toString(),
                ...entry,
                created_at: now.toISOString(),
                updated_at: now.toISOString()
            }
        }, 201);

    } catch (error) {
        console.error('Create entry error:', error);
        return errorResponse('Failed to create entry', 500);
    }
}

// Update entry
async function updateEntry(event) {
    try {
        const userId = event.user.user_id;
        const entryId = getPathParam(event, 'id');
        const body = parseBody(event);

        if (!entryId) {
            return errorResponse('Entry ID required');
        }

        const entries = await getCollection('entries');
        const existing = await entries.findOne({
            _id: new ObjectId(entryId),
            user_id: userId
        });

        if (!existing) {
            return errorResponse('Entry not found', 404);
        }

        // Build update
        const updateFields = { updated_at: new Date() };
        if (body.title !== undefined) updateFields.title = body.title.trim();
        if (body.content !== undefined) updateFields.content = body.content.trim();
        if (body.tags !== undefined) updateFields.tags = body.tags;
        if (body.is_favorite !== undefined) updateFields.is_favorite = body.is_favorite;

        await entries.updateOne(
            { _id: new ObjectId(entryId) },
            { $set: updateFields }
        );

        return successResponse({ message: 'Entry updated' });

    } catch (error) {
        console.error('Update entry error:', error);
        return errorResponse('Failed to update entry', 500);
    }
}

// Delete entry
async function deleteEntry(event) {
    try {
        const userId = event.user.user_id;
        const entryId = getPathParam(event, 'id');

        if (!entryId) {
            return errorResponse('Entry ID required');
        }

        const entries = await getCollection('entries');
        const result = await entries.deleteOne({
            _id: new ObjectId(entryId),
            user_id: userId
        });

        if (result.deletedCount === 0) {
            return errorResponse('Entry not found', 404);
        }

        return successResponse({ message: 'Entry deleted' });

    } catch (error) {
        console.error('Delete entry error:', error);
        return errorResponse('Failed to delete entry', 500);
    }
}

// Search entries
async function searchEntries(event) {
    try {
        const userId = event.user.user_id;
        const query = getQueryParam(event, 'q', '');

        if (!query || query.length < 2) {
            return errorResponse('Search query must be at least 2 characters');
        }

        const entries = await getCollection('entries');
        const cursor = entries.find({
            user_id: userId,
            $text: { $search: query }
        }).limit(20);

        const results = await cursor.toArray();

        const formatted = results.map(entry => ({
            _id: entry._id.toString(),
            title: entry.title,
            content: entry.content.substring(0, 200),
            created_at: entry.created_at.toISOString()
        }));

        return successResponse({ entries: formatted });

    } catch (error) {
        console.error('Search error:', error);
        return errorResponse('Search failed', 500);
    }
}

module.exports = { getEntries, getEntry, createEntry, updateEntry, deleteEntry, searchEntries };
