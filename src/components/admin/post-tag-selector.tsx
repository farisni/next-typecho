"use client";

import { Popover } from "@base-ui/react/popover";
import { ChevronDown, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type TagOption = {
  id: string;
  name: string;
};

type PostTagSelectorProps = {
  tags: TagOption[];
  defaultValue?: TagOption[];
};

function normalizeTagName(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

export function PostTagSelector({ tags, defaultValue = [] }: PostTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => defaultValue.map((tag) => tag.id));
  const [newTagNames, setNewTagNames] = useState<string[]>([]);

  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedIds.includes(tag.id)),
    [selectedIds, tags],
  );
  const normalizedQuery = normalizeTagName(query);
  const canCreate = normalizedQuery.length > 0
    && !tags.some((tag) => tag.name.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase())
    && !newTagNames.some((name) => name.toLocaleLowerCase() === normalizedQuery.toLocaleLowerCase());

  const toggleTag = (tagId: string) => {
    setSelectedIds((current) => (
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    ));
  };

  const createTag = () => {
    if (!canCreate) return;
    setNewTagNames((current) => [...current, normalizedQuery]);
    setQuery("");
  };

  const selectedCount = selectedTags.length + newTagNames.length;

  return (
    <div className="post-tag-selector flex flex-col gap-2.5">
      {selectedIds.map((tagId) => (
        <input key={tagId} type="hidden" name="tagIds" value={tagId} />
      ))}
      {newTagNames.map((name) => (
        <input key={name} type="hidden" name="newTagNames" value={name} />
      ))}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          type="button"
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 border border-input bg-background px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:border-foreground"
        >
          <span className={selectedCount > 0 ? "text-foreground" : "text-muted-foreground"}>
            {selectedCount > 0 ? `已选择 ${selectedCount} 个标签` : "选择或新建标签"}
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            align="start"
            side="bottom"
            sideOffset={4}
            className="isolate z-50 outline-none"
          >
            <Popover.Popup className="w-(--anchor-width) min-w-52 border border-foreground/30 bg-popover text-popover-foreground shadow-md outline-none">
              <Popover.Title className="sr-only">选择或新建文章标签</Popover.Title>
              <Command className="rounded-none! p-0">
                <CommandInput
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="搜索或输入新标签..."
                />
                <CommandList>
                  <CommandEmpty>没有匹配的标签</CommandEmpty>
                  {canCreate && (
                    <CommandGroup heading="新建">
                      <CommandItem
                        value={`新建 ${normalizedQuery}`}
                        onSelect={createTag}
                        className="rounded-none"
                      >
                        <Plus aria-hidden="true" />
                        新建“{normalizedQuery}”
                      </CommandItem>
                    </CommandGroup>
                  )}
                  {tags.length > 0 && (
                    <CommandGroup heading="已有标签">
                      {tags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          data-checked={selectedIds.includes(tag.id)}
                          onSelect={() => toggleTag(tag.id)}
                          className="rounded-none"
                        >
                          {tag.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              render={(
                <button type="button" onClick={() => toggleTag(tag.id)} aria-label={`移除标签 ${tag.name}`} />
              )}
              variant="secondary"
              className="cursor-pointer rounded-none"
            >
              {tag.name}
              <X aria-hidden="true" data-icon="inline-end" />
            </Badge>
          ))}
          {newTagNames.map((name) => (
            <Badge
              key={name}
              render={(
                <button
                  type="button"
                  onClick={() => setNewTagNames((current) => current.filter((item) => item !== name))}
                  aria-label={`移除新标签 ${name}`}
                />
              )}
              variant="outline"
              className="cursor-pointer rounded-none"
            >
              {name}
              <X aria-hidden="true" data-icon="inline-end" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
