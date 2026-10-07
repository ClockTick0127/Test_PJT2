"use client";

import Link from "next/link";
import { ChevronRight, FileText, Paperclip } from "lucide-react";
import type { Experience } from "@folio/shared";
import { period } from "@/lib/utils";
import { completeness } from "@/lib/mock-analysis";
import { Badge } from "./ui/primitives";

export function DocumentList({
  items,
  compact = false,
}: {
  items: Experience[];
  compact?: boolean;
}) {
  return (
    <div className={"document-list" + (compact ? " compact" : "")}>
      <div className="document-list-heading" aria-hidden="true">
        <span>문서 이름</span>
        <span>사용 기술</span>
        <span>문서 상태</span>
        <span>근거 자료</span>
        <span />
      </div>
      {items.map((experience) => (
        <Link href={"/experience/" + experience.id} className="document-row" key={experience.id}>
          <span className="document-file-icon">
            <FileText size={21} strokeWidth={1.5} />
          </span>
          <span className="document-row-title">
            <strong>{experience.title}</strong>
            <small>
              {experience.type} · {period(experience.startDate, experience.endDate)} ·{" "}
              {completeness(experience)}% 완성
            </small>
          </span>
          <span className="document-row-skills">
            {experience.skills.slice(0, 2).map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </span>
          <span className={"document-status " + experience.status}>
            <i />
            {experience.status === "approved" ? "정리 완료" : "검토할 초안"}
          </span>
          <span className="document-row-evidence">
            <Paperclip size={13} />
            {experience.evidence.length}
          </span>
          <ChevronRight size={15} className="document-row-arrow" />
        </Link>
      ))}
    </div>
  );
}
