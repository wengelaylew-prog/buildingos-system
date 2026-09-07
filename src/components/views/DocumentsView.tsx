import React, { useEffect, useState } from 'react';
import {
  FolderArchive,
  Upload,
  Search,
  FileText,
  Building2,
  DoorOpen,
  User,
  ExternalLink,
  Trash2,
  AlertCircle,
  FileCheck,
  HardDrive,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Document, Building, Tenant, Unit } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const DocumentsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [documentsList, setDocumentsList] = useState<Document[]>([]);
  const [buildingsList, setBuildingsList] = useState<Building[]>([]);
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [formData, setFormData] = useState({
    entityType: 'building',
    entityId: '',
    fileName: '',
    fileType: 'application/pdf',
    fileSize: 1024 * 350,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [entityTypeFilter]);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const [docs, bldgs, tenants, units] = await Promise.all([
        api.getDocuments({ entityType: entityTypeFilter, search }),
        api.getBuildings(),
        api.getTenants(),
        api.getUnits(),
      ]);
      setDocumentsList(docs);
      setBuildingsList(bldgs);
      setTenantsList(tenants);
      setUnitsList(units);

      if (bldgs.length > 0) {
        setFormData((prev) => ({ ...prev, entityId: bldgs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocs();
  };

  const openUploadModal = () => {
    setFormData({
      entityType: 'building',
      entityId: buildingsList[0]?.id || '',
      fileName: '',
      fileType: 'application/pdf',
      fileSize: 1024 * 350,
    });
    setFormError(null);
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await api.uploadDocument(formData);
      setIsUploadOpen(false);
      loadDocs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Permanently delete document "${doc.fileName}"?`)) return;
    try {
      await api.deleteDocument(doc.id);
      loadDocs();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div id="documents-view" className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <form onSubmit={handleSearch} className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="doc-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document name or type..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            id="doc-entity-filter"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Entity Scopes</option>
            <option value="building">Buildings</option>
            <option value="unit">Units</option>
            <option value="tenant">Tenants</option>
            <option value="contract">Contracts</option>
          </select>

          {hasPermission('document.upload') && (
            <button
              id="upload-doc-button"
              type="button"
              onClick={openUploadModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Attach Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Storage Architecture Overview Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold">StorageService Abstraction Active</div>
            <p className="text-[11px] text-slate-400">
              Decoupled polymorphic storage architecture • Ready for Cloudflare R2, AWS S3, or Firebase Storage
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
          {documentsList.length} Objects Indexed
        </span>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading documents index...</div>
        ) : documentsList.length === 0 ? (
          <div className="py-16 text-center p-6 text-xs text-slate-400">
            No documents matching the selected scope.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Entity Scope</th>
                  <th className="py-3 px-4">MIME Type</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documentsList.map((doc) => (
                  <tr key={doc.storageKey} id={`doc-row-${doc.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate max-w-xs">{doc.fileName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium uppercase text-[10px] text-slate-700 border border-slate-200">
                        {doc.entityType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{doc.fileType}</td>
                    <td className="py-3 px-4 text-slate-600">{Math.round(doc.fileSize / 1024)} KB</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded text-xs flex items-center gap-1 font-semibold"
                          title="Open Document"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                        {hasPermission('document.delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Attach Document Metadata"
        subtitle="Upload title deed, architectural plan, ID copy, or signed agreement."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Entity Scope *</label>
              <select
                value={formData.entityType}
                onChange={(e) => {
                  const type = e.target.value;
                  let defaultId = '';
                  if (type === 'building') defaultId = buildingsList[0]?.id || '';
                  if (type === 'tenant') defaultId = tenantsList[0]?.id || '';
                  if (type === 'unit') defaultId = unitsList[0]?.id || '';
                  setFormData({ ...formData, entityType: type, entityId: defaultId });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="building">Building (Title, Permits, Blueprints)</option>
                <option value="tenant">Tenant (National ID, TIN, Registration)</option>
                <option value="unit">Unit (Inspection, Floorplan)</option>
                <option value="contract">Contract (Signed Agreement)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associate With Target *</label>
              <select
                required
                value={formData.entityId}
                onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                {formData.entityType === 'building' &&
                  buildingsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                {formData.entityType === 'tenant' &&
                  tenantsList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.phone})
                    </option>
                  ))}
                {formData.entityType === 'unit' &&
                  unitsList.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber} ({u.building?.name})
                    </option>
                  ))}
                {formData.entityType === 'contract' &&
                  buildingsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      General Contract Archive
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document File Name *</label>
            <input
              type="text"
              required
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
              placeholder="e.g. Addis_Ababa_City_Building_Permit_2026.pdf"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Format</label>
              <select
                value={formData.fileType}
                onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="application/pdf">PDF Document (*.pdf)</option>
                <option value="image/jpeg">JPEG Image (*.jpg, *.jpeg)</option>
                <option value="image/png">PNG Image (*.png)</option>
                <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                  Word Document (*.docx)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">File Size (Bytes)</label>
              <input
                type="number"
                value={formData.fileSize}
                onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value, 10) || 1024 })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
