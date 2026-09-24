"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { ArchiveModel } from "@/lib/presentation/types";
import { createTreeLayout, getBranchPersonIds, type TreeNode } from "@/lib/presentation/tree-layout";
import { Icon } from "@/components/ui/Icon";
import { PersonInspector } from "./PersonInspector";
import { TreeCard } from "./TreeCard";

const selectClass = "max-w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface";

export function TreeExplorer({ archive }: { archive: ArchiveModel }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const requestedPerson = searchParams.get("person") ?? "";
  const requestedBranch = searchParams.get("branch") ?? "";
  const [collapsed, setCollapsed] = useState(false);
  const [prevRequestedPerson, setPrevRequestedPerson] = useState(requestedPerson);
  if (requestedPerson !== prevRequestedPerson) {
    setPrevRequestedPerson(requestedPerson);
    setCollapsed(false);
  }
  const [scalePercent, setScalePercent] = useState(100);
  const [ready, setReady] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [fitRequest, setFitRequest] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const peopleById = useMemo(() => new Map(archive.people.map((person) => [person.id, person])), [archive.people]);
  const selected = peopleById.get(requestedPerson);
  const branch = archive.branches.find((item) => item.id === requestedBranch);
  const branchAncestor = peopleById.get(requestedBranch);
  const activeBranchId = branch || branchAncestor ? requestedBranch : "";
  const branchLabel = branch?.label ?? (branchAncestor ? `${branchAncestor.displayName} branch` : "All branches");
  const visiblePeople = useMemo(() => {
    if (!activeBranchId) return archive.people;
    const ids = branch ? new Set(branch.personIds) : getBranchPersonIds(archive.people, activeBranchId);
    return archive.people.filter((person) => ids.has(person.id));
  }, [activeBranchId, archive.people, branch]);
  const layout = useMemo(() => createTreeLayout(visiblePeople), [visiblePeople]);
  const generationCount = new Set(visiblePeople.flatMap((person) => person.generation === undefined ? [] : [person.generation])).size;
  const visiblePersonIds = useMemo(() => new Set(visiblePeople.map((person) => person.id)), [visiblePeople]);
  const sortedPeople = useMemo(() => [...archive.people].sort((a, b) => a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id, "en", { numeric: true })), [archive.people]);

  const updateLocation = useCallback((person: string, branchId: string) => {
    const params = new URLSearchParams(query);
    if (person) params.set("person", person); else params.delete("person");
    if (branchId) params.set("branch", branchId); else params.delete("branch");
    router.push(`/tree${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }, [query, router]);

  const selectPerson = useCallback((id: string) => {
    setCollapsed(false);
    updateLocation(id, visiblePersonIds.has(id) ? activeBranchId : "");
  }, [activeBranchId, updateLocation, visiblePersonIds]);

  const centerNode = useCallback((node: TreeNode, duration = 240) => {
    if (!transformRef.current || !viewportSize.width) return;
    const inspectorSpace = selected && viewportSize.width >= 768 ? 345 : 0;
    const width = viewportSize.width - inspectorSpace;
    const height = selected && viewportSize.width < 768 ? viewportSize.height * 0.45 : viewportSize.height;
    const scale = Math.min(1, Math.max(0.4, (width - 48) / node.width));
    transformRef.current.setTransform(width / 2 - (node.x + node.width / 2) * scale, height / 2 - (node.y + node.height / 2) * scale, scale, duration);
  }, [selected, viewportSize]);

  const fitGraph = useCallback((duration = 240) => {
    if (!transformRef.current || !viewportSize.width) return;
    const scale = Math.max(0.02, Math.min(1, (viewportSize.width - 48) / layout.width, (viewportSize.height - 48) / layout.height));
    transformRef.current.setTransform((viewportSize.width - layout.width * scale) / 2, (viewportSize.height - layout.height * scale) / 2, scale, duration);
  }, [layout.height, layout.width, viewportSize]);

  const resetTree = useCallback(() => {
    setCollapsed(false);
    updateLocation("", "");
    setFitRequest((value) => value + 1);
  }, [updateLocation]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(() => {
      const selectedNode = selected ? layout.nodes.find((node) => node.personIds.includes(selected.id)) : undefined;
      if (selectedNode) centerNode(selectedNode, 0); else fitGraph(0);
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, layout, selected, centerNode, fitGraph, fitRequest]);

  function onCanvasKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !transformRef.current) return;
    const transform = transformRef.current;
    const { positionX, positionY, scale } = transform.state;
    const movement = 72;
    switch (event.key) {
      case "+": case "=": transform.zoomIn(); break;
      case "-": transform.zoomOut(); break;
      case "0": resetTree(); break;
      case "ArrowLeft": transform.setTransform(positionX + movement, positionY, scale, 100); break;
      case "ArrowRight": transform.setTransform(positionX - movement, positionY, scale, 100); break;
      case "ArrowUp": transform.setTransform(positionX, positionY + movement, scale, 100); break;
      case "ArrowDown": transform.setTransform(positionX, positionY - movement, scale, 100); break;
      case "Escape": updateLocation("", activeBranchId); break;
      default: return;
    }
    event.preventDefault();
  }

  return (
    <div className="border-t border-outline-variant">
      <section aria-label="Tree controls" className="border-b border-outline-variant bg-surface-container-lowest px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-x-8 gap-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center border border-outline-variant bg-surface-container-low"><Icon name="tree" className="h-5 w-5" /></div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-secondary">The family, connected</p>
              <h1 className="font-headline text-3xl leading-tight">Interactive Tree</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex max-w-full flex-col gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary">Branch</span>
              <select aria-label="Filter tree by branch" value={activeBranchId} onChange={(event) => { updateLocation("", event.target.value); }} className={`${selectClass} w-[200px]`}>
                <option value="">All branches</option>
                {activeBranchId && !branch && <option value={activeBranchId}>{branchLabel}</option>}
                {archive.branches.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="flex max-w-full flex-col gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary">Find a person</span>
              <select aria-label="Find a person in tree" value={selected?.id ?? ""} onChange={(event) => { if (event.target.value) selectPerson(event.target.value); else updateLocation("", activeBranchId); }} className={`${selectClass} w-[220px]`}>
                <option value="">Select a person</option>
                {sortedPeople.map((person) => <option key={person.id} value={person.id}>{person.displayName} · {person.id}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant px-5 py-3 text-xs sm:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span><strong className="font-headline text-xl font-semibold">{visiblePeople.length}</strong> <span className="text-secondary">indexed people</span></span>
          <span><strong className="font-headline text-xl font-semibold">{generationCount}</strong> <span className="text-secondary">generations</span></span>
          {activeBranchId && <span className="bg-primary px-2 py-1 text-[10px] text-white">{branchLabel}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-outline-variant bg-white">
            <button type="button" aria-label="Zoom out" onClick={() => transformRef.current?.zoomOut()} className="p-2.5 text-secondary hover:bg-surface-container-low"><Icon name="minus" className="h-4 w-4" /></button>
            <output aria-label="Tree zoom" className="min-w-12 border-x border-outline-variant px-2 text-center text-[10px] tabular-nums text-secondary">{scalePercent}%</output>
            <button type="button" aria-label="Zoom in" onClick={() => transformRef.current?.zoomIn()} className="p-2.5 text-secondary hover:bg-surface-container-low"><Icon name="plus" className="h-4 w-4" /></button>
          </div>
          <button type="button" onClick={resetTree} aria-label="Reset tree and show everyone" className="flex items-center gap-2 border border-outline-variant bg-white px-3 py-2.5 text-[10px] hover:bg-surface-container-low"><Icon name="expand" className="h-4 w-4" />Reset tree</button>
        </div>
      </div>

      {(requestedPerson && !selected) || (requestedBranch && !activeBranchId) ? <p role="status" className="border-b border-outline-variant bg-surface-container-low px-5 py-3 text-xs text-secondary">That {requestedPerson && !selected ? "person" : "branch"} could not be found. The available family records are shown below.</p> : null}
      {selected && !visiblePersonIds.has(selected.id) ? <p role="status" className="border-b border-outline-variant bg-surface-container-low px-5 py-3 text-xs text-secondary">{selected.displayName} is outside this branch. <button type="button" onClick={() => updateLocation(selected.id, "")} className="font-semibold underline underline-offset-4">Show in full tree</button></p> : null}

      <div ref={viewportRef} className="relative h-[70svh] min-h-[540px] overflow-hidden bg-surface md:h-[calc(100svh-280px)] md:min-h-[600px]" style={{ backgroundImage: "radial-gradient(#d2c3c1 0.8px, transparent 0.8px)", backgroundSize: "24px 24px" }}>
        <div role="region" aria-label="Interactive family tree canvas" aria-describedby="tree-instructions" tabIndex={0} onKeyDown={onCanvasKeyDown} className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
          <TransformWrapper
            ref={transformRef}
            initialScale={0.1}
            minScale={0.02}
            maxScale={2.5}
            limitToBounds={false}
            centerZoomedOut={false}
            doubleClick={{ disabled: true }}
            panning={{ excluded: ["button"] }}
            wheel={{ step: 0.12 }}
            onInit={() => setReady(true)}
            onTransform={(_, state) => setScalePercent(Math.round(state.scale * 100))}
          >
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: layout.width, height: layout.height }}>
              <div className="relative" style={{ width: layout.width, height: layout.height }}>
                {layout.columns.map((column) => (
                  <div key={column.generation ?? "unassigned"} className="absolute top-6 border-l-2 border-primary bg-surface/95 px-4 pb-3 pt-1" style={{ left: column.x, width: column.width }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">{column.generation === undefined ? "Unassigned generation" : `Generation ${column.generation}`}</p>
                    <p className="mt-1 font-headline text-2xl">{column.personCount} recorded {column.personCount === 1 ? "life" : "lives"}</p>
                  </div>
                ))}
                <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height}>
                  {layout.edges.map((edge) => <path key={edge.id} d={edge.path} fill="none" stroke={selected && edge.personIds.includes(selected.id) ? "#1b1c1a" : "#b5a5a2"} strokeWidth={selected && edge.personIds.includes(selected.id) ? 2.5 : 1.3} />)}
                </svg>
                {layout.nodes.map((node) => <TreeCard key={node.id} node={node} peopleById={peopleById} rootId={archive.rootId} selectedId={selected?.id} onSelect={selectPerson} onFocus={(node) => {
                  // Keyboard tabbing keeps cards visible without changing the selected record.
                  if (document.activeElement?.matches(":focus-visible")) centerNode(node, 0);
                }} />)}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
        {!layout.nodes.length && <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center font-headline text-3xl">No people are recorded in this branch.</div>}
        {!selected && layout.nodes.length > 0 && <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 w-max max-w-[calc(100%-40px)] -translate-x-1/2 border border-outline-variant bg-surface-container-lowest px-5 py-3 text-center text-[11px] text-secondary shadow-search-float">The complete family at a glance. Zoom in or choose a person to begin.</div>}
        {selected && <PersonInspector person={selected} peopleById={peopleById} collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} onClose={() => updateLocation("", activeBranchId)} onFocusBranch={() => updateLocation(selected.id, selected.id)} onSelect={selectPerson} />}
      </div>
      <div className="flex flex-wrap justify-between gap-3 border-t border-outline-variant bg-surface-container-lowest px-5 py-4 text-[10px] leading-relaxed text-secondary sm:px-8">
        <p id="tree-instructions">Drag to explore · Scroll or pinch to zoom · Focus the canvas for arrow keys, + / −, and 0 to reset</p>
        <Link href="/people" className="flex items-center gap-2 font-medium text-on-surface underline decoration-outline-variant underline-offset-4">Browse the people index <Icon name="arrow-right" className="h-3 w-3" /></Link>
      </div>
    </div>
  );
}
