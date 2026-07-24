"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FolderPlus, MoreHorizontal, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import {
  bulkDeleteCategories,
  bulkDeleteTags,
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
} from "@/actions/taxonomies";
import { AdminBulkMenu } from "@/components/admin/admin-bulk-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TaxonomyItem = { id: string; name: string; slug: string };

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="typecho-list-operate taxonomy-list-toolbar">
        <div className="operate taxonomy-toolbar-actions">
          <AdminBulkMenu formId={formId} actions={[{ icon: Trash2, label: "删除", variant: "destructive" }]} />
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger
              render={(
                <Button type="button" variant="outline" size="sm" className="category-create-trigger rounded-none">
                  <Plus aria-hidden="true" />
                  新增分类
                </Button>
              )}
            />
            <DialogContent className="category-create-dialog rounded-none sm:max-w-md">
              <DialogHeader>
                <DialogTitle>新增分类</DialogTitle>
                <DialogDescription>创建一个新的文章分类，用于整理和归档站点内容。</DialogDescription>
              </DialogHeader>
              <form
                className="category-create-dialog-form"
                action={async (formData) => {
                  await createCategory(formData);
                  setCreateDialogOpen(false);
                }}
              >
                <label>
                  <span className="typecho-label">分类名称</span>
                  <input name="name" autoFocus required />
                </label>
                <label>
                  <span className="typecho-label">分类缩略名</span>
                  <input name="slug" placeholder="category-slug" required />
                </label>
                <p className="description-text">缩略名将用于分类链接，建议使用简短的英文或拼音。</p>
                <DialogFooter className="category-create-dialog-footer rounded-none">
                  <DialogClose render={<Button type="button" variant="outline" className="rounded-none" />}>
                    取消
                  </DialogClose>
                  <Button type="submit" className="rounded-none">增加分类</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
          <thead>
            <tr>
              <th>
                <label>
                  <span className="sr-only">全选</span>
                  <input ref={selectAllRef} type="checkbox" className="typecho-table-select-all" checked={allSelected} onChange={(event) => selectAll(event.target.checked)} />
                </label>
              </th>
              <th>名称</th>
              <th>子分类</th>
              <th>缩略名</th>
              <th className="category-count-column">文章数</th>
              <th className="post-actions-column">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && <tr><td className="none" colSpan={6}>没有任何分类</td></tr>}
            {categories.map((item) => {
              const checked = selected.has(item.id);
              return (
                <tr key={item.id} className={checked ? "current" : undefined}>
                  <td><input type="checkbox" name="ids" value={item.id} checked={checked} onChange={(event) => selectItem(item.id, event.target.checked)} aria-label={`选择 ${item.name}`} /></td>
                  <td><Link href={`/categories/${item.slug}`}>{item.name}</Link></td>
                  <td>
                    <Badge variant="outline" className="category-child-badge">
                      <FolderPlus aria-hidden="true" />
                      新增
                    </Badge>
                  </td>
                  <td>{item.slug}</td>
                  <td className="category-count-cell"><span className="category-post-count">0</span></td>
                  <td className="post-actions-cell">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={(
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="post-actions-trigger"
                            aria-label={`打开 ${item.name} 的操作菜单`}
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </Button>
                        )}
                      />
                      <DropdownMenuContent align="end" className="post-actions-menu rounded-none">
                        <DropdownMenuItem
                          nativeButton
                          variant="destructive"
                          render={<button type="submit" form={`delete-category-${item.id}`} />}
                        >
                          <Trash2 aria-hidden="true" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="typecho-list-operate taxonomy-list-toolbar">
        <div className="operate taxonomy-toolbar-actions">
          <label><span className="sr-only">全选</span><input ref={selectAllRef} type="checkbox" className="typecho-table-select-all" checked={allSelected} onChange={(event) => selectAll(event.target.checked)} /></label>
          <AdminBulkMenu formId={formId} actions={[{ icon: Trash2, label: "删除", variant: "destructive" }]} />
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger
              render={(
                <Button type="button" variant="outline" size="sm" className="category-create-trigger rounded-none">
                  <Plus aria-hidden="true" />
                  新增标签
                </Button>
              )}
            />
            <DialogContent className="category-create-dialog rounded-none sm:max-w-md">
              <DialogHeader>
                <DialogTitle>新增标签</DialogTitle>
                <DialogDescription>创建一个新的文章标签，用于关联和检索相关内容。</DialogDescription>
              </DialogHeader>
              <form
                className="category-create-dialog-form"
                action={async (formData) => {
                  await createTag(formData);
                  setCreateDialogOpen(false);
                }}
              >
                <label>
                  <span className="typecho-label">标签名称</span>
                  <input name="name" autoFocus required />
                </label>
                <label>
                  <span className="typecho-label">标签缩略名</span>
                  <input name="slug" placeholder="tag-slug" required />
                </label>
                <p className="description-text">缩略名将用于标签链接，建议使用简短的英文或拼音。</p>
                <DialogFooter className="category-create-dialog-footer rounded-none">
                  <DialogClose render={<Button type="button" variant="outline" className="rounded-none" />}>
                    取消
                  </DialogClose>
                  <Button type="submit" className="rounded-none">增加标签</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
          {tags.map((item) => {
            const checked = selected.has(item.id);
            return (
              <li key={item.id} className={checked ? "current" : undefined}>
                <input type="checkbox" name="ids" value={item.id} checked={checked} onChange={(event) => selectItem(item.id, event.target.checked)} aria-label={`选择 ${item.name}`} />
                <Badge variant={checked ? "default" : "outline"} className="admin-tag-badge">
                  <TagIcon aria-hidden="true" />
                  {item.name}
                </Badge>
                <Button
                  form={`delete-tag-${item.id}`}
                  title={`删除 ${item.name}`}
                  aria-label={`删除 ${item.name}`}
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  className="admin-tag-delete rounded-none"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      </form>
      {tags.map((item) => <form key={item.id} id={`delete-tag-${item.id}`} action={deleteTag.bind(null, item.id)} />)}
    </>
  );
}
