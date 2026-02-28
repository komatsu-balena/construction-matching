'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CONSTRUCTION_LICENSES } from '@/lib/constants/licenses';
import { PREFECTURES } from '@/lib/constants/prefectures';
import styles from './profile-edit.module.css';

type Tab = 'user' | 'company' | 'licenses' | 'seeking';

interface Props {
  user: {
    id: string;
    full_name: string;
    email: string;
    position: string;
    phone: string;
    bio: string;
    company_id: string;
  };
  company: {
    id: string;
    name: string;
    description: string;
    prefecture: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    company_role: string;
    employee_count: number;
    capital_amount: number;
    founded_year: number;
    seeking_roles: string[];
    seeking_description: string;
  } | null;
  selectedLicenses: string[];
  specialtyWorks: string[];
}

export default function ProfileEditForm({ user, company, selectedLicenses: initLicenses, specialtyWorks: initWorks }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('user');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User form state
  const [userForm, setUserForm] = useState({
    full_name: user.full_name ?? '',
    position: user.position ?? '',
    phone: user.phone ?? '',
    bio: user.bio ?? '',
  });

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: company?.name ?? '',
    description: company?.description ?? '',
    prefecture: company?.prefecture ?? '',
    address: company?.address ?? '',
    phone: company?.phone ?? '',
    email: company?.email ?? '',
    website: company?.website ?? '',
    company_role: company?.company_role ?? 'both',
    employee_count: company?.employee_count?.toString() ?? '',
    capital_amount: company?.capital_amount ? (company.capital_amount / 10000).toString() : '',
    founded_year: company?.founded_year?.toString() ?? '',
    seeking_description: company?.seeking_description ?? '',
  });

  // Licenses state
  const [licenses, setLicenses] = useState<string[]>(initLicenses);
  const [specialtyWorks, setSpecialtyWorks] = useState<string[]>(initWorks);
  const [newWork, setNewWork] = useState('');

  // Seeking roles state
  const [seekingRoles, setSeekingRoles] = useState<string[]>(company?.seeking_roles ?? []);

  function toggleLicense(id: string) {
    setLicenses((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  function toggleSeekingRole(role: string) {
    setSeekingRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function addWork() {
    const trimmed = newWork.trim();
    if (trimmed && !specialtyWorks.includes(trimmed)) {
      setSpecialtyWorks((prev) => [...prev, trimmed]);
    }
    setNewWork('');
  }

  function removeWork(w: string) {
    setSpecialtyWorks((prev) => prev.filter((x) => x !== w));
  }

  async function saveUser() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? '保存に失敗しました');
      } else {
        setSuccess('個人情報を更新しました');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  async function saveCompany() {
    if (!company) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        ...companyForm,
        employee_count: companyForm.employee_count ? parseInt(companyForm.employee_count) : null,
        capital_amount: companyForm.capital_amount ? parseInt(companyForm.capital_amount) * 10000 : null,
        founded_year: companyForm.founded_year ? parseInt(companyForm.founded_year) : null,
      };
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? '保存に失敗しました');
      } else {
        setSuccess('会社情報を更新しました');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  async function saveLicenses() {
    if (!company) return;
    setSaving(true);
    setError('');
    try {
      // Save licenses
      const resLic = await fetch(`/api/companies/${company.id}/licenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_type_ids: licenses }),
      });
      // Save specialty works
      const resWork = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialty_works: specialtyWorks }),
      });
      if (!resLic.ok || !resWork.ok) {
        setError('保存に失敗しました');
      } else {
        setSuccess('許可・得意工事を更新しました');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  async function saveSeeking() {
    if (!company) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seeking_roles: seekingRoles,
          seeking_description: companyForm.seeking_description,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? '保存に失敗しました');
      } else {
        setSuccess('求めることを更新しました');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Link href="/profile" className={styles.backLink}>← プロフィールに戻る</Link>
        <h1 className={styles.pageTitle}>プロフィール編集</h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['user', 'company', 'licenses', 'seeking'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(''); setSuccess(''); }}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
          >
            {tab === 'user' ? '個人情報'
              : tab === 'company' ? '会社基本情報'
              : tab === 'licenses' ? '許可・得意工事'
              : '求めること'}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.successMsg}>{success}</p>}

      {/* User Tab */}
      {activeTab === 'user' && (
        <div className={styles.card}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>氏名</label>
              <input
                type="text"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                className={styles.input}
                placeholder="山田 太郎"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>役職</label>
              <input
                type="text"
                value={userForm.position}
                onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                className={styles.input}
                placeholder="代表取締役"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>電話番号</label>
              <input
                type="tel"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                className={styles.input}
                placeholder="090-1234-5678"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>自己紹介</label>
              <textarea
                value={userForm.bio}
                onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })}
                className={styles.textarea}
                rows={4}
                placeholder="自己紹介を入力してください"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button onClick={saveUser} disabled={saving} className={styles.saveBtn}>
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && company && (
        <div className={styles.card}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>会社名</label>
              <input
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>会社の役割</label>
              <select
                value={companyForm.company_role}
                onChange={(e) => setCompanyForm({ ...companyForm, company_role: e.target.value })}
                className={styles.select}
              >
                <option value="both">元請・下請（両方）</option>
                <option value="general_contractor">元請のみ</option>
                <option value="subcontractor">下請のみ</option>
              </select>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>都道府県</label>
                <select
                  value={companyForm.prefecture}
                  onChange={(e) => setCompanyForm({ ...companyForm, prefecture: e.target.value })}
                  className={styles.select}
                >
                  <option value="">選択してください</option>
                  {PREFECTURES.map((p) => (
                    <option key={p.code} value={p.nameJa}>{p.nameJa}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>設立年</label>
                <input
                  type="number"
                  value={companyForm.founded_year}
                  onChange={(e) => setCompanyForm({ ...companyForm, founded_year: e.target.value })}
                  className={styles.input}
                  placeholder="2000"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>住所</label>
              <input
                type="text"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className={styles.input}
                placeholder="東京都新宿区〇〇1-2-3"
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>電話番号</label>
                <input
                  type="tel"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className={styles.input}
                  placeholder="03-1234-5678"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>メールアドレス</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className={styles.input}
                  placeholder="info@example.co.jp"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Webサイト</label>
              <input
                type="url"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                className={styles.input}
                placeholder="https://example.co.jp"
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>従業員数（名）</label>
                <input
                  type="number"
                  value={companyForm.employee_count}
                  onChange={(e) => setCompanyForm({ ...companyForm, employee_count: e.target.value })}
                  className={styles.input}
                  placeholder="50"
                  min="1"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>資本金（万円）</label>
                <input
                  type="number"
                  value={companyForm.capital_amount}
                  onChange={(e) => setCompanyForm({ ...companyForm, capital_amount: e.target.value })}
                  className={styles.input}
                  placeholder="1000"
                  min="0"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>会社概要</label>
              <textarea
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                className={styles.textarea}
                rows={5}
                placeholder="会社の特徴・強みを入力してください"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button onClick={saveCompany} disabled={saving} className={styles.saveBtn}>
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      )}

      {/* Licenses Tab */}
      {activeTab === 'licenses' && company && (
        <div className={styles.card}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>建設業許可 ({licenses.length}件選択中)</h3>
            <div className={styles.licenseGrid}>
              {CONSTRUCTION_LICENSES.map((lic) => (
                <label key={lic.id} className={`${styles.licenseItem} ${licenses.includes(String(lic.id)) ? styles.licenseSelected : ''}`}>
                  <input
                    type="checkbox"
                    checked={licenses.includes(String(lic.id))}
                    onChange={() => toggleLicense(String(lic.id))}
                    className={styles.checkbox}
                  />
                  <span className={styles.licenseName}>{lic.nameJa}</span>
                  <span className={styles.licenseCategory}>
                    {lic.category === 'general' ? '一式' : '専門'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>得意工事</h3>
            <div className={styles.tagInput}>
              <input
                type="text"
                value={newWork}
                onChange={(e) => setNewWork(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWork())}
                className={styles.tagInputField}
                placeholder="例：RC造建築工事"
              />
              <button onClick={addWork} className={styles.addTagBtn} type="button">追加</button>
            </div>
            <div className={styles.tags}>
              {specialtyWorks.map((w) => (
                <span key={w} className={styles.tag}>
                  {w}
                  <button onClick={() => removeWork(w)} className={styles.removeTagBtn}>×</button>
                </span>
              ))}
              {specialtyWorks.length === 0 && (
                <p className={styles.tagEmpty}>得意工事を追加してください</p>
              )}
            </div>
          </div>

          <div className={styles.formActions}>
            <button onClick={saveLicenses} disabled={saving} className={styles.saveBtn}>
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      )}

      {/* Seeking Tab */}
      {activeTab === 'seeking' && company && (
        <div className={styles.card}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>求めるパートナーの役割</h3>
            <div className={styles.roleOptions}>
              {[
                { value: 'general_contractor', label: '元請企業' },
                { value: 'subcontractor', label: '下請企業' },
                { value: 'both', label: '両方' },
              ].map((opt) => (
                <label key={opt.value} className={`${styles.roleOption} ${seekingRoles.includes(opt.value) ? styles.roleOptionSelected : ''}`}>
                  <input
                    type="checkbox"
                    checked={seekingRoles.includes(opt.value)}
                    onChange={() => toggleSeekingRole(opt.value)}
                    className={styles.checkbox}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>求めることの説明</h3>
            <textarea
              value={companyForm.seeking_description}
              onChange={(e) => setCompanyForm({ ...companyForm, seeking_description: e.target.value })}
              className={styles.textarea}
              rows={5}
              placeholder="どのようなパートナー企業を求めているか詳しく記載してください..."
            />
          </div>

          <div className={styles.formActions}>
            <button onClick={saveSeeking} disabled={saving} className={styles.saveBtn}>
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
