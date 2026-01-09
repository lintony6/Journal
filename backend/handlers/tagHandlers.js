// Tag handlers
const { ObjectId } = require('mongodb');
const { getCollection } = require('../database');
const { parseBody, getPathParam, successResponse, errorResponse } = require('../helpers');

// Get all tags for user
async function getTags(event) {
    try {
        const userId = event.user.user_id;

        const tags = await getCollection('tags');
        const cursor = tags.find({ user_id: userId }).sort({ name: 1 });
        const results = await cursor.toArray();

        const formatted = results.map(tag => ({
            _id: tag._id.toString(),
            name: tag.name,
            color: tag.color,
            created_at: tag.created_at.toISOString()
        }));

        return successResponse({ tags: formatted });

    } catch (error) {
        console.error('Get tags error:', error);
        return errorResponse('Failed to fetch tags', 500);
    }
}

// Create tag
async function createTag(event) {
    try {
        const userId = event.user.user_id;
        const body = parseBody(event);

        const name = (body.name || '').trim();
        const color = body.color || '#6366f1';

        if (!name) {
            return errorResponse('Tag name is required');
        }
        if (name.length > 50) {
            return errorResponse('Tag name must be 50 characters or less');
        }

        const tags = await getCollection('tags');

        // Check for duplicate (case-insensitive)
        const existing = await tags.findOne({
            user_id: userId,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existing) {
            return errorResponse('Tag already exists');
        }

        const now = new Date();
        const tag = {
            user_id: userId,
            name,
            color,
            created_at: now
        };

        const result = await tags.insertOne(tag);

        return successResponse({
            tag: {
                _id: result.insertedId.toString(),
                name,
                color,
                created_at: now.toISOString()
            }
        }, 201);

    } catch (error) {
        console.error('Create tag error:', error);
        return errorResponse('Failed to create tag', 500);
    }
}

// Update tag
async function updateTag(event) {
    try {
        const userId = event.user.user_id;
        const tagId = getPathParam(event, 'id');
        const body = parseBody(event);

        if (!tagId) {
            return errorResponse('Tag ID required');
        }

        const tags = await getCollection('tags');
        const existing = await tags.findOne({
            _id: new ObjectId(tagId),
            user_id: userId
        });

        if (!existing) {
            return errorResponse('Tag not found', 404);
        }

        // Build update
        const updateFields = {};
        if (body.name !== undefined) {
            const name = body.name.trim();
            if (!name) {
                return errorResponse('Tag name is required');
            }
            updateFields.name = name;
        }
        if (body.color !== undefined) {
            updateFields.color = body.color;
        }

        if (Object.keys(updateFields).length > 0) {
            await tags.updateOne(
                { _id: new ObjectId(tagId) },
                { $set: updateFields }
            );
        }

        return successResponse({ message: 'Tag updated' });

    } catch (error) {
        console.error('Update tag error:', error);
        return errorResponse('Failed to update tag', 500);
    }
}

// Delete tag
async function deleteTag(event) {
    try {
        const userId = event.user.user_id;
        const tagId = getPathParam(event, 'id');

        if (!tagId) {
            return errorResponse('Tag ID required');
        }

        const tags = await getCollection('tags');
        const entries = await getCollection('entries');

        // Delete the tag
        const result = await tags.deleteOne({
            _id: new ObjectId(tagId),
            user_id: userId
        });

        if (result.deletedCount === 0) {
            return errorResponse('Tag not found', 404);
        }

        // Remove tag from all entries
        await entries.updateMany(
            { user_id: userId, tags: tagId },
            { $pull: { tags: tagId } }
        );

        return successResponse({ message: 'Tag deleted' });

    } catch (error) {
        console.error('Delete tag error:', error);
        return errorResponse('Failed to delete tag', 500);
    }
}

module.exports = { getTags, createTag, updateTag, deleteTag };
