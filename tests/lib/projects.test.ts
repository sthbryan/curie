import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project, ProjectProbe } from "@/components/types";

const invokeMock = vi.fn();
const openMock = vi.fn();
const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: unknown[]) => openMock(...args),
}));
vi.mock("sonner", () => ({ toast: toastMock }));

const { addProject, forgetProject, isNested, loadProjects, samePath, slugify } = await import(
  "@/lib/projects"
);
const { projects, projectsError } = await import("@/store/projects");
const { lang } = await import("@/store/system");

const donCamaron: Project = {
  id: "don_camaron",
  name: "don_camaron",
  path: "/code/don_camaron",
  addedAt: "2026-07-27T00:00:00.000Z",
};

function probe(path: string, name: string): ProjectProbe {
  return { path, name, exists: true, isDir: true, isReserved: false };
}

beforeEach(() => {
  lang.value = "en";
  projects.value = [];
  projectsError.value = null;
  invokeMock.mockReset();
  openMock.mockReset();
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  toastMock.info.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("slugify", () => {
  it("keeps a plain folder name", () => {
    expect(slugify("don_camaron")).toBe("don_camaron");
  });

  it("tames a domain-shaped name", () => {
    expect(slugify("mi_taquito.com")).toBe("mi_taquito.com");
  });

  it("collapses anything unsafe for a url segment", () => {
    expect(slugify("My Project!")).toBe("my-project");
  });

  it("never returns an empty id", () => {
    expect(slugify("///")).toBe("project");
  });
});

describe("path comparison", () => {
  it("treats a case difference as the same folder", () => {
    expect(samePath("/code/Dev", "/code/dev")).toBe(true);
  });

  it("spots an ancestor and a descendant", () => {
    expect(isNested("/code", "/code/don_camaron")).toBe(true);
    expect(isNested("/code/don_camaron", "/code")).toBe(true);
  });

  it("leaves siblings alone", () => {
    expect(isNested("/code/a", "/code/b")).toBe(false);
  });

  it("does not call a folder nested inside itself", () => {
    expect(isNested("/code/a", "/code/a/")).toBe(false);
  });
});

describe("loadProjects", () => {
  it("fills the registry", async () => {
    invokeMock.mockResolvedValue([donCamaron]);
    await loadProjects();
    expect(projects.value).toEqual([donCamaron]);
  });

  it("records the error and leaves the registry alone", async () => {
    invokeMock.mockRejectedValue(new Error("no disk"));
    await loadProjects();
    expect(projectsError.value).toBe("no disk");
    expect(projects.value).toEqual([]);
  });
});

describe("addProject", () => {
  it("registers the picked folder and saves it", async () => {
    openMock.mockResolvedValue("/code/don_camaron");
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "validate_project_path") {
        return Promise.resolve(probe("/code/don_camaron", "don_camaron"));
      }
      if (cmd === "write_projects") return Promise.resolve();
      return Promise.resolve([]);
    });

    const added = await addProject();

    expect(added?.id).toBe("don_camaron");
    expect(added?.path).toBe("/code/don_camaron");
    expect(projects.value).toHaveLength(1);
    expect(invokeMock).toHaveBeenCalledWith("write_projects", { projects: projects.value });
  });

  it("does nothing when the picker is cancelled", async () => {
    openMock.mockResolvedValue(null);
    expect(await addProject()).toBeNull();
    expect(projects.value).toEqual([]);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("rejects a path that is not a folder", async () => {
    openMock.mockResolvedValue("/code/notes.md");
    invokeMock.mockResolvedValue({
      path: "/code/notes.md",
      name: "notes.md",
      exists: true,
      isDir: false,
      isReserved: false,
    });

    expect(await addProject()).toBeNull();
    expect(projects.value).toEqual([]);
    expect(toastMock.error).toHaveBeenCalled();
  });

  it("returns the existing entry instead of duplicating it", async () => {
    projects.value = [donCamaron];
    openMock.mockResolvedValue("/code/don_camaron");
    invokeMock.mockResolvedValue(probe("/code/don_camaron", "don_camaron"));

    expect(await addProject()).toEqual(donCamaron);
    expect(projects.value).toHaveLength(1);
    expect(toastMock.info).toHaveBeenCalled();
  });

  it("refuses a folder that contains a registered project", async () => {
    projects.value = [donCamaron];
    openMock.mockResolvedValue("/code");
    invokeMock.mockResolvedValue(probe("/code", "code"));

    expect(await addProject()).toBeNull();
    expect(projects.value).toHaveLength(1);
    expect(toastMock.error).toHaveBeenCalled();
  });

  it("gives a second folder of the same name a distinct id", async () => {
    projects.value = [donCamaron];
    openMock.mockResolvedValue("/other/don_camaron");
    invokeMock.mockImplementation((cmd) =>
      cmd === "validate_project_path"
        ? Promise.resolve(probe("/other/don_camaron", "don_camaron"))
        : Promise.resolve(),
    );

    expect((await addProject())?.id).toBe("don_camaron-2");
  });

  it("rolls the registry back when the write fails", async () => {
    openMock.mockResolvedValue("/code/don_camaron");
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "validate_project_path") {
        return Promise.resolve(probe("/code/don_camaron", "don_camaron"));
      }
      return Promise.reject(new Error("read-only disk"));
    });

    expect(await addProject()).toBeNull();
    expect(projects.value).toEqual([]);
    expect(toastMock.error).toHaveBeenCalled();
  });
});

describe("forgetProject", () => {
  it("drops the entry and saves", async () => {
    projects.value = [donCamaron];
    invokeMock.mockResolvedValue(undefined);

    expect(await forgetProject(donCamaron)).toBe(true);
    expect(projects.value).toEqual([]);
    expect(invokeMock).toHaveBeenCalledWith("write_projects", { projects: [] });
  });

  it("puts the entry back when the write fails", async () => {
    projects.value = [donCamaron];
    invokeMock.mockRejectedValue(new Error("read-only disk"));

    expect(await forgetProject(donCamaron)).toBe(false);
    expect(projects.value).toEqual([donCamaron]);
  });
});
