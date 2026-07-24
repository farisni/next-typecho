"use client";

import { useActionState } from "react";
import { saveThemeSettings, type ThemeSettingsState } from "@/actions/themes";
import {
  getThemeDefinition,
  type ThemeConfig,
  type ThemeSlug,
} from "@/lib/themes/registry";

const initialState: ThemeSettingsState = {};

function Message({ state }: { state: ThemeSettingsState }) {
  if (!state.message) return null;
  return (
    <div className={`message ${state.status === "success" ? "success" : "error"}`} role="status">
      {state.message}
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="description-text theme-field-error">{messages[0]}</p>;
}

export function ThemeSettingsForm({
  theme,
  config,
}: {
  theme: ThemeSlug;
  config: ThemeConfig;
}) {
  const [state, action, pending] = useActionState(saveThemeSettings, initialState);
  const definition = getThemeDefinition(theme);
  const values = config as unknown as Record<string, unknown>;

  return (
    <form action={action}>
      <input type="hidden" name="theme" value={theme} />
      <Message state={state} />
      <ul className="typecho-option">
        {definition.settings.map((field) => {
          const fieldId = `theme-${field.name}`;
          const value = values[field.name];

          if (field.kind === "checkbox-group") {
            const selected = Array.isArray(value) ? value : [];
            return (
              <li key={field.name}>
                <span className="typecho-label">{field.label}</span>
                <div className="theme-checkbox-list">
                  {field.options.map((option) => (
                    <label key={option.value}>
                      <input
                        type="checkbox"
                        name={field.name}
                        value={option.value}
                        defaultChecked={selected.includes(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                <FieldError messages={state.fieldErrors?.[field.name]} />
              </li>
            );
          }

          if (field.kind === "select") {
            return (
              <li key={field.name}>
                <label className="typecho-label" htmlFor={fieldId}>{field.label}</label>
                <select
                  id={fieldId}
                  name={field.name}
                  defaultValue={typeof value === "string" ? value : ""}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className="description-text">{field.description}</p>
                <FieldError messages={state.fieldErrors?.[field.name]} />
              </li>
            );
          }

          return (
            <li key={field.name}>
              <label className="typecho-label" htmlFor={fieldId}>{field.label}</label>
              <input
                className="text"
                id={fieldId}
                name={field.name}
                type="url"
                defaultValue={typeof value === "string" ? value : ""}
                placeholder={field.placeholder}
              />
              <p className="description-text">{field.description}</p>
              <FieldError messages={state.fieldErrors?.[field.name]} />
            </li>
          );
        })}
      </ul>
      <ul className="typecho-option typecho-option-submit">
        <li>
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "正在保存…" : "保存设置"}
          </button>
        </li>
      </ul>
    </form>
  );
}
