"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type MaterialType = "업무간소화" | "교수학습자료";

type Material = {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  tags: string[];
  subjects: string[];
  author: string;
  url: string;
  thumbnail?: string;
  staffOnly: boolean;
  updatedAt: string;
  status?: "운영 중" | "검토 중";
};

const REMOTE_CATALOG_URL =
  "https://raw.githubusercontent.com/vibeoschool/education-materials-catalog/main/catalog.json";

const workTags = [
  "교무·학사",
  "출결",
  "생활지도",
  "평가·성적",
  "상담",
  "행정·문서",
  "일정·소통",
  "시설·기자재",
];

const subjects = [
  "국어",
  "수학",
  "영어",
  "사회",
  "역사",
  "과학",
  "도덕",
  "기술·가정",
  "정보",
  "체육",
  "음악",
  "미술",
  "진로",
  "특수",
  "창의적 체험활동",
];

const fallbackMaterials: Material[] = [
  {
    id: "app-sonyoungguk-sciencelab",
    title: "과학실험 시뮬레이션",
    description:
      "학생들이 수업 중 과학 개념을 직접 조작하고 관찰하며 탐구할 수 있는 디지털 실험실입니다.",
    type: "교수학습자료",
    tags: ["탐구 활동", "수업 활용"],
    subjects: ["과학"],
    author: "손영국",
    url: "https://app-sonyoungguk-sciencelab.vercel.app",
    staffOnly: false,
    updatedAt: "2026-07-23",
    status: "운영 중",
  },
];

const typeOptions = ["전체", "업무간소화", "교수학습자료", "교직원 전용"] as const;

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

function SearchIcon() {
  return <span aria-hidden="true">⌕</span>;
}

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function LockIcon() {
  return <span className="key-icon" aria-hidden="true" />;
}

function MaterialCard({ material, index }: { material: Material; index: number }) {
  const labels =
    material.type === "교수학습자료" ? material.subjects : material.tags;
  const isAvailable = material.status !== "검토 중" && Boolean(material.url);

  return (
    <article className="material-card" style={{ "--delay": `${index * 45}ms` } as React.CSSProperties}>
      <div className={`card-visual visual-${(index % 4) + 1}`}>
        {material.thumbnail ? (
          // Screenshots are produced by the deployment workflow and may live on GitHub.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={material.thumbnail} alt={`${material.title} 화면 미리보기`} />
        ) : (
          <div className="visual-placeholder" aria-hidden="true">
            <span className="visual-orbit" />
            <span className="visual-grid" />
            <span className="visual-letter">
              {material.type === "교수학습자료" ? "배움" : "업무"}
            </span>
          </div>
        )}
        <div className="visual-topline">
          <span className={`type-chip ${material.type === "업무간소화" ? "work" : "learn"}`}>
            {material.type}
          </span>
          {material.staffOnly ? (
            <span className="access-chip staff">
              <LockIcon /> 교직원 전용
            </span>
          ) : (
            <span className="access-chip public">누구나 이용</span>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="label-row">
          {labels.slice(0, 3).map((label) => (
            <span className="label-chip" key={label}>
              {label}
            </span>
          ))}
        </div>
        <h3>{material.title}</h3>
        <p className="card-description">{material.description}</p>

        <div className="card-meta">
          <div>
            <span className="author-mark" aria-hidden="true">
              {material.author.slice(0, 1)}
            </span>
            <span>
              <strong>{material.author} 선생님</strong>
              <small>제작 · {formatDate(material.updatedAt)} 업데이트</small>
            </span>
          </div>
          {isAvailable ? (
            <a
              className={`open-button ${material.staffOnly ? "locked" : ""}`}
              href={material.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${material.title} ${material.staffOnly ? "학교 Google 로그인 후 " : ""}열기`}
            >
              {material.staffOnly ? "Google 로그인" : "자료 열기"}
              <ArrowIcon />
            </a>
          ) : (
            <span className="review-state">검토 중</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [materials, setMaterials] = useState<Material[]>(fallbackMaterials);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeType, setActiveType] = useState<(typeof typeOptions)[number]>("전체");
  const [activeDetail, setActiveDetail] = useState("전체 분야");
  const [sort, setSort] = useState("최신순");
  const [catalogUpdated, setCatalogUpdated] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const cacheWindow = Math.floor(Date.now() / 300_000);
        const response = await fetch(`${REMOTE_CATALOG_URL}?v=${cacheWindow}`);
        if (!response.ok) return;
        const data = (await response.json()) as Material[] | { materials: Material[] };
        const nextMaterials = Array.isArray(data) ? data : data.materials;
        if (active && Array.isArray(nextMaterials) && nextMaterials.length > 0) {
          setMaterials(nextMaterials);
          setCatalogUpdated(true);
        }
      } catch {
        // The built-in catalog keeps the portal useful while the shared catalog
        // is being created or briefly unavailable.
      }
    }

    loadCatalog();
    const timer = window.setInterval(loadCatalog, 300_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const detailOptions = useMemo(() => {
    if (activeType === "업무간소화") return workTags;
    if (activeType === "교수학습자료") return subjects;
    return [...workTags, ...subjects];
  }, [activeType]);

  useEffect(() => {
    setActiveDetail("전체 분야");
  }, [activeType]);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = submittedQuery.trim().toLocaleLowerCase("ko-KR");
    const next = materials.filter((material) => {
      const matchesType =
        activeType === "전체" ||
        (activeType === "교직원 전용"
          ? material.staffOnly
          : material.type === activeType);
      const matchesDetail =
        activeDetail === "전체 분야" ||
        material.tags.includes(activeDetail) ||
        material.subjects.includes(activeDetail);
      const searchable = [
        material.title,
        material.description,
        material.author,
        material.type,
        ...material.tags,
        ...material.subjects,
      ]
        .join(" ")
        .toLocaleLowerCase("ko-KR");
      return matchesType && matchesDetail && searchable.includes(normalizedQuery);
    });

    return [...next].sort((a, b) => {
      if (sort === "이름순") return a.title.localeCompare(b.title, "ko");
      if (sort === "제작자순") return a.author.localeCompare(b.author, "ko");
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [activeDetail, activeType, materials, sort, submittedQuery]);

  const uniqueTeachers = useMemo(
    () => new Set(materials.map((material) => material.author)).size,
    [materials],
  );
  const workMaterialCount = materials.filter(
    (material) => material.type === "업무간소화",
  ).length;
  const learningMaterialCount = materials.filter(
    (material) => material.type === "교수학습자료",
  ).length;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
    document.getElementById("materials")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="오션중학교 교육자료 나눔터 홈">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="brand-logo"
            src="/ocean-middle-school-logo.jpg"
            alt=""
            width={44}
            height={45}
          />
          <span>
            <strong>오션중학교</strong>
            <small>교육자료 나눔터</small>
          </span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#materials">자료 둘러보기</a>
          <a href="#guide">이용 안내</a>
          <a className="nav-cta" href="#submit">
            자료 등록
            <span aria-hidden="true">＋</span>
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-intro">
            <p className="eyebrow">
              <span aria-hidden="true">✦</span>
              OCEAN MIDDLE SCHOOL · TEACHER-MADE
            </p>
            <h1>
              선생님의 좋은 아이디어가
              <br />
              <em>수업 효율화와 업무간소화</em>에 큰 힘이 됩니다
            </h1>
            <p className="hero-copy">
              오션중학교 선생님들이 직접 만든 웹앱과 교육자료를 한곳에서
              발견하고, 바로 수업과 학교 업무에 활용하세요.
            </p>

            <form className="hero-search" onSubmit={submitSearch}>
              <label className="sr-only" htmlFor="hero-search">
                교육자료 검색
              </label>
              <span className="search-glyph">
                <SearchIcon />
              </span>
              <input
                id="hero-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="자료명, 과목, 업무 태그, 선생님 이름으로 검색"
              />
              <button type="submit">자료 찾기</button>
            </form>
          </div>

          <aside className="hero-metrics" aria-label="나눔터 현황">
            <div>
              <strong>{materials.length}</strong>
              <span>공유된 자료</span>
            </div>
            <div>
              <strong>{Math.max(uniqueTeachers, 1)}</strong>
              <span>참여 선생님</span>
            </div>
            <div>
              <strong>{workMaterialCount}</strong>
              <span>업무 도구</span>
            </div>
            <div>
              <strong>{learningMaterialCount}</strong>
              <span>수업 자료</span>
            </div>
          </aside>

          <div className="hero-bottom">
            <div className="quick-links">
              <span>빠른 탐색</span>
              {["과학", "출결", "역사", "평가·성적"].map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    setQuery(label);
                    setSubmittedQuery(label);
                    document.getElementById("materials")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  #{label}
                </button>
              ))}
            </div>
            <div className="live-note">
              <span className="live-dot" />
              {catalogUpdated ? "공유 자료와 자동 동기화 중" : "새로운 자료를 계속 준비하고 있어요"}
            </div>
          </div>
        </div>
      </section>

      <section className="catalog" id="materials">
        <div className="section-heading">
          <div>
            <p className="section-kicker">DISCOVER & USE</p>
            <h2>필요한 자료를 찾아보세요</h2>
            <p>수업 준비부터 학교 업무까지, 선생님의 오늘을 가볍게 만듭니다.</p>
          </div>
          <div className="privacy-note">
            <span className="mini-lock" aria-hidden="true">
              <LockIcon />
            </span>
            <p>
              <strong>자물쇠가 있는 자료는 교직원 전용입니다.</strong>
              <span>@ocean.ms.kr Google 계정으로 로그인해 주세요.</span>
            </p>
          </div>
        </div>

        <div className="filter-panel">
          <div className="type-tabs" role="group" aria-label="자료 유형">
            {typeOptions.map((type) => (
              <button
                className={activeType === type ? "active" : ""}
                key={type}
                onClick={() => setActiveType(type)}
                aria-pressed={activeType === type}
              >
                {type === "교직원 전용" && (
                  <span className="tab-lock">
                    <LockIcon />
                  </span>
                )}
                {type}
                {type === "전체" && <span className="tab-count">{materials.length}</span>}
              </button>
            ))}
          </div>
          <div className="filter-actions">
            <label>
              <span className="sr-only">세부 분야</span>
              <select
                value={activeDetail}
                onChange={(event) => setActiveDetail(event.target.value)}
              >
                <option>전체 분야</option>
                {detailOptions.map((detail) => (
                  <option key={detail}>{detail}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">정렬</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option>최신순</option>
                <option>이름순</option>
                <option>제작자순</option>
              </select>
            </label>
          </div>
        </div>

        <div className="catalog-summary" aria-live="polite">
          <p>
            <strong>{filteredMaterials.length}개</strong>의 자료를 찾았습니다
            {submittedQuery && (
              <span>
                {" "}
                · 검색어 <b>“{submittedQuery}”</b>
              </span>
            )}
          </p>
          {(submittedQuery || activeType !== "전체" || activeDetail !== "전체 분야") && (
            <button
              onClick={() => {
                setQuery("");
                setSubmittedQuery("");
                setActiveType("전체");
                setActiveDetail("전체 분야");
              }}
            >
              필터 초기화
            </button>
          )}
        </div>

        {filteredMaterials.length > 0 ? (
          <div className="card-grid">
            {filteredMaterials.map((material, index) => (
              <MaterialCard key={material.id} material={material} index={index} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">⌕</span>
            <h3>검색 결과가 아직 없어요</h3>
            <p>다른 검색어나 분야를 선택해 보세요. 새로운 자료도 계속 추가됩니다.</p>
            <button
              onClick={() => {
                setQuery("");
                setSubmittedQuery("");
                setActiveType("전체");
                setActiveDetail("전체 분야");
              }}
            >
              전체 자료 보기
            </button>
          </div>
        )}
      </section>

      <section className="guide" id="guide">
        <div className="guide-copy">
          <p className="section-kicker">HOW IT WORKS</p>
          <h2>선생님은 제출만,<br />나머지는 자동으로.</h2>
          <p>
            GitHub 주소와 자료 정보를 등록하면 검토 후 학교 계정으로 안전하게
            복제·배포하고, 첫 화면을 촬영해 나눔터에 올립니다.
          </p>
          <a href="#submit">
            등록 절차 살펴보기 <ArrowIcon />
          </a>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>구글폼 제출</strong>
              <p>자료 설명, 분류, 공개 범위와 GitHub 주소를 입력합니다.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>개인정보·보안 검토</strong>
              <p>학생정보 처리와 교직원 로그인 적용 여부를 먼저 확인합니다.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>자동 배포·화면 캡처</strong>
              <p>배포된 첫 화면을 대표 이미지로 만들고 자료 목록에 반영합니다.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="submission-banner" id="submit">
        <div className="banner-art" aria-hidden="true">
          <span className="wave wave-one" />
          <span className="wave wave-two" />
          <span className="pearl">✦</span>
        </div>
        <div>
          <p className="section-kicker">SHARE YOUR IDEA</p>
          <h2>새로운 교육자료를 만들고 계신가요?</h2>
          <p>선생님의 작은 아이디어가 오션중학교 모두의 시간을 아껴줍니다.</p>
        </div>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSeE01BtZ9vZcxxItjoNduSKKcv6evGpsmhUyGUeREriXu1hhw/viewform"
          target="_blank"
          rel="noreferrer"
          aria-label="교육자료 등록 구글폼 열기"
        >
          자료 등록하기 <ArrowIcon />
        </a>
      </section>

      <footer>
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="brand-logo"
            src="/ocean-middle-school-logo.jpg"
            alt=""
            width={36}
            height={37}
          />
          <p>
            <strong>오션중학교 교육자료 나눔터</strong>
            <span>선생님의 아이디어로 함께 만드는 더 나은 학교</span>
          </p>
        </div>
        <p className="footer-note">
          공개 목록에는 학생 개인정보를 표시하지 않습니다.
          <br />© 2026 Ocean Middle School.
        </p>
      </footer>
    </main>
  );
}
