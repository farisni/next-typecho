"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  bulkDeleteCategories,
  bulkDeleteTags,
  deleteCategory,
  deleteTag,
} from "@/actions/taxonomies";

type TaxonomyItem = { id: string; name: string; slug: string };

function BulkMenu({ formId }: { formId: string }) {
  return (
    <details className="btn-group btn-drop">
      <summary className="btn dropdown-toggle btn-s">选中项 <i className="i-caret-down" aria-hidden="true" /></summary>
      <ul className="dropdown-menu">
        <li><button form={formId} type="submit">删除</button></li>
      </ul>
    </details>
  );
}

function useTaxonomySelection(items: TaxonomyItem[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const allSelected = items.length > 0 && selected.size === items.length;
  const partlySelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = partlySelected;
  }, [partlySelected]);

  function selectAll(checked: boolean) {
    setSelected(checked ? new Set(items.map((item) => item.id)) : new Set());
  }

  function selectItem(itemId: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

  return { selected, selectAllRef, allSelected, selectAll, selectItem };
}

export function AdminCategoryList({ categories }: { categories: TaxonomyItem[] }) {
  const formId = "manage-categories";
  const { selected, selectAllRef, allSelected, selectAll, selectItem } = useTaxonomySelection(categories);

  return (
    <>
      <div className="typecho-list-operate">
        <div className="operate">
          <label><span className="sr-only">全选</span><input ref={selectAllRef} type="checkbox" className="typecho-table-select-all" checked={allSelected} onChange={(event) => selectAll(event.target.checked)} /></label>
          <BulkMenu formId={formId} />
        </div>
      </div>
      <form
        id={formId}
        action={bulkDeleteCategories}
        className="operate-form"
        onSubmit={(event) => {
          if (selected.size === 0) {
            event.preventDefault();
            window.alert("请选择要操作的分类");
          } else if (!window.confirm("此分类下的所有内容将被移出分类，你确认要删除这些分类吗?")) {
            event.preventDefault();
          }
        }}
      >
        <table className="typecho-list-table category-list-table">
          <thead><tr><th /><th>名称</th><th>子分类</th><th>缩略名</th><th /><th>文章数</th></tr></thead>
          <tbody>
            {categories.length === 0 && <tr><td className="none" colSpan={6}>没有任何分类</td></tr>}
            {categories.map((item) => {
              const checked = selected.has(item.id);
              return (
                <tr key={item.id} className={checked ? "current" : undefined}>
                  <td><input type="checkbox" name="ids" value={item.id} checked={checked} onChange={(event) => selectItem(item.id, event.target.checked)} aria-label={`选择 ${item.name}`} /></td>
                  <td><Link href={`/categories/${item.slug}`}>{item.name}</Link></td>
                  <td><span className="description-text">新增</span></td>
                  <td>{item.slug}</td>
                  <td><button className="row-delete-button" form={`delete-category-${item.id}`} type="submit">删除</button></td>
                  <td><span className="balloon-button">0</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </form>
      {categories.map((item) => <form key={item.id} id={`delete-category-${item.id}`} action={deleteCategory.bind(null, item.id)} />)}
    </>
  );
}

export function AdminTagList({ tags }: { tags: TaxonomyItem[] }) {
  const formId = "manage-tags";
  const { selected, selectAllRef, allSelected, selectAll, selectItem } = useTaxonomySelection(tags);

  return (
    <>
      <div className="typecho-list-operate">
        <div className="operate">
          <label><span className="sr-only">全选</span><input ref={selectAllRef} type="checkbox" className="typecho-table-select-all" checked={allSelected} onChange={(event) => selectAll(event.target.checked)} /></label>
          <BulkMenu formId={formId} />
        </div>
      </div>
      <form
        id={formId}
        action={bulkDeleteTags}
        className="operate-form"
        onSubmit={(event) => {
          if (selected.size === 0) {
            event.preventDefault();
            window.alert("请选择要操作的标签");
          } else if (!window.confirm("你确认要删除这些标签吗?")) {
            event.preventDefault();
          }
        }}
      >
        <ul className="typecho-list-notable tag-list">
          {tags.length === 0 && <li className="none">没有任何标签</li>}
          {tags.map((item, index) => {
            const checked = selected.has(item.id);
            return (
              <li key={item.id} className={`size-${index % 3 + 1}${checked ? " current" : ""}`}>
                <input type="checkbox" name="ids" value={item.id} checked={checked} onChange={(event) => selectItem(item.id, event.target.checked)} aria-label={`选择 ${item.name}`} />
                <span>{item.name}</span>
                <button form={`delete-tag-${item.id}`} title={`删除 ${item.name}`} type="submit">×</button>
              </li>
            );
          })}
        </ul>
      </form>
      {tags.map((item) => <form key={item.id} id={`delete-tag-${item.id}`} action={deleteTag.bind(null, item.id)} />)}
    </>
  );
}
