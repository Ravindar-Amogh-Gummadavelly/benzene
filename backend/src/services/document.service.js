import { db } from '../prisma/db.ts';

/**
 * Format document database record into rich JSON response.
 */
function formatDocument(doc, fdr) {
  if (!doc) return null;

  return {
    id: doc.id,
    fileName: doc.fileName,
    filePath: doc.filePath,
    documentType: doc.documentType,
    fdrRecordId: doc.fdrRecordId,
    fdrNumber: fdr?.fdrNumber || null,
    institutionId: fdr?.institutionId || null,
    uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt.toString()).toISOString() : null,
    // Derived UI helper fields
    status: 'VERIFIED',
    storageMode: 'METADATA_PROTOTYPE',
    fileSize: '1.5 MB', // Prototype display size
  };
}

export const documentService = {
  /**
   * Helper to write an AuditLog record.
   */
  async logAudit({ action, entityId, details, userId }) {
    try {
      const nowIso = new Date().toISOString();
      await db.orm.public.AuditLog.create({
        action,
        entityType: 'Document',
        entityId: entityId || null,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        userId: userId || null,
        createdAt: nowIso,
      });
    } catch (e) {
      console.warn('AuditLog creation notice (Document):', e.message);
    }
  },

  /**
   * GET /api/documents
   * Supports filtering by fdrRecordId, documentType, search
   */
  async getAllDocuments({ fdrRecordId, fdrNumber, documentType, search } = {}) {
    let query = db.orm.public.Document.include('fdrRecord');

    if (fdrRecordId) {
      const parsedId = parseInt(fdrRecordId, 10);
      if (!isNaN(parsedId)) {
        query = query.where({ fdrRecordId: parsedId });
      }
    }

    let records = await query.all();

    if (fdrNumber && fdrNumber.trim()) {
      const fn = fdrNumber.trim().toLowerCase();
      records = records.filter((r) => r.fdrRecord?.fdrNumber?.toLowerCase().includes(fn));
    }

    if (documentType && documentType.trim() && documentType !== 'All') {
      const dt = documentType.trim().toLowerCase();
      records = records.filter((r) => r.documentType?.toLowerCase() === dt);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      records = records.filter(
        (r) =>
          r.fileName?.toLowerCase().includes(q) ||
          r.documentType?.toLowerCase().includes(q) ||
          r.fdrRecord?.fdrNumber?.toLowerCase().includes(q)
      );
    }

    // Sort descending by id
    records.sort((a, b) => b.id - a.id);

    return records.map((r) => formatDocument(r, r.fdrRecord));
  },

  /**
   * GET /api/documents/:id
   */
  async getDocumentById(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid Document ID.');
      err.statusCode = 400;
      throw err;
    }

    const doc = await db.orm.public.Document
      .include('fdrRecord')
      .where({ id: parsedId })
      .first();

    return doc ? formatDocument(doc, doc.fdrRecord) : null;
  },

  /**
   * POST /api/documents
   * Create document metadata
   */
  async createDocument({ fdrRecordId, fdrNumber, fileName, filePath, documentType }) {
    if (!fileName || !fileName.trim()) {
      const err = new Error('Document fileName is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!documentType || !documentType.trim()) {
      const err = new Error('Document documentType is required.');
      err.statusCode = 400;
      throw err;
    }

    // Resolve FDR Record
    let fdr = null;
    if (fdrRecordId) {
      const parsed = parseInt(fdrRecordId, 10);
      if (!isNaN(parsed)) {
        fdr = await db.orm.public.FdrRecord.where({ id: parsed }).first();
      }
    }
    if (!fdr && fdrNumber) {
      fdr = await db.orm.public.FdrRecord.where({ fdrNumber: fdrNumber.trim() }).first();
    }

    if (!fdr) {
      const err = new Error('Associated FDR Record could not be found.');
      err.statusCode = 404;
      throw err;
    }

    const cleanPath = (filePath && filePath.trim()) ? filePath.trim() : `/documents/fdr_${fdr.id}/${fileName.trim()}`;
    const nowIso = new Date().toISOString();

    const created = await db.orm.public.Document.create({
      fileName: fileName.trim(),
      filePath: cleanPath,
      documentType: documentType.trim(),
      fdrRecordId: fdr.id,
      uploadedAt: nowIso,
    });

    await this.logAudit({
      action: 'DOCUMENT_CREATED',
      entityId: created.id,
      details: `Document '${created.fileName}' (${created.documentType}) attached to FDR ${fdr.fdrNumber}.`,
    });

    return formatDocument(created, fdr);
  },

  /**
   * PUT /api/documents/:id
   * Update document metadata
   */
  async updateDocument(id, { fileName, documentType, filePath }) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid Document ID.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.Document
      .include('fdrRecord')
      .where({ id: parsedId })
      .first();

    if (!existing) {
      const err = new Error(`Document with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const updatePayload = {};
    if (fileName !== undefined) updatePayload.fileName = fileName.trim();
    if (documentType !== undefined) updatePayload.documentType = documentType.trim();
    if (filePath !== undefined) updatePayload.filePath = filePath.trim();

    await db.orm.public.Document.where({ id: parsedId }).update(updatePayload);

    await this.logAudit({
      action: 'DOCUMENT_UPDATED',
      entityId: parsedId,
      details: `Document #${parsedId} metadata updated.`,
    });

    const updated = await db.orm.public.Document
      .include('fdrRecord')
      .where({ id: parsedId })
      .first();

    return formatDocument(updated, updated?.fdrRecord);
  },

  /**
   * DELETE /api/documents/:id
   * Delete document metadata
   */
  async deleteDocument(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid Document ID.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.Document
      .include('fdrRecord')
      .where({ id: parsedId })
      .first();

    if (!existing) {
      return false;
    }

    await db.orm.public.Document.where({ id: parsedId }).delete();

    await this.logAudit({
      action: 'DOCUMENT_DELETED',
      entityId: parsedId,
      details: `Document '${existing.fileName}' removed from FDR ${existing.fdrRecord?.fdrNumber || existing.fdrRecordId}.`,
    });

    return true;
  },
};
