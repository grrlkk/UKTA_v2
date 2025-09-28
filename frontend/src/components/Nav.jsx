import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from "../contexts/LanguageContext";
import { LABELS } from "../labels";

const Nav = ({ currentPage, darkMode, setDarkMode }) => {
  const [scrollDown, setScrollDown] = useState(0);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrollDown(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  return (
    <nav className="fixed top-0 bg-slate-50 bg-opacity-40 dark:bg-slate-950 dark:bg-opacity-40 w-full backdrop-blur z-50 shadow-sm">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* 왼쪽: 로고 + 토글 버튼 + 다크모드 버튼 */}
        <div className="flex items-center gap-2">
          <Link to='/' className="flex gap-2 items-center group">
            <p className="text-lg font-black group-hover:text-slate-500">UKTA</p>
          </Link>
          {/* 언어 토글 버튼 */}
          <button
            onClick={toggleLanguage}
            className="
              text-xs px-2 py-1 rounded
              bg-slate-100 dark:bg-slate-800
              hover:bg-slate-200 dark:hover:bg-slate-700
              transition-all
              font-medium
            "
          >
            {language === 'ko' ? 'Eng' : '한국어'}
          </button>
          {/* 다크모드 토글 버튼 */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs font-medium ml-1"
            aria-label="다크모드 토글"
          >
            <span className="text-base">{darkMode ? '🌙' : '☀️'}</span>
            {/*<span className="hidden sm:inline">{darkMode ? '다크' : '라이트'}</span>*/}
          </button>
        </div>

        {/* 오른쪽: 네비게이션 메뉴 */}
        <div className="whitespace-nowrap items-end flex text-sm *:px-2 divide-x-2 dark:divide-slate-700">
          <Link to="/"
            className={`
              hover:text-slate-500
              ${currentPage === "/" ? "font-bold" : "text-opacity-50"} 
              transition-all ease-in-out
            `}
          >
            {LABELS.home[language]}
          </Link>
          <Link to="/analysis"
            className={`
              hover:text-slate-500
              ${currentPage === "/analysis" ? "font-bold" : "text-opacity-50"} 
              transition-all ease-in-out
            `}
          >
            {LABELS.analysis[language]}
          </Link>
          <Link to="/feedback"
            className={`
              hover:text-slate-500
              ${currentPage === "/feedback" ? "font-bold" : "text-opacity-50"} 
              transition-all ease-in-out
            `}
          >
            {LABELS.feedback[language]}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { useLanguage } from "../contexts/LanguageContext";
// import { LABELS } from "../labels";

// const Nav = ({ currentPage }) => {
//   const [scrollDown, setScrollDown] = useState(0);
//   const { language, setLanguage } = useLanguage();

//   useEffect(() => {
//     const handleScroll = () => setScrollDown(window.scrollY);
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   const toggleLanguage = () => {
//     setLanguage(language === 'ko' ? 'en' : 'ko');
//   };

//   return (
//     <nav className="fixed top-0 bg-slate-50 bg-opacity-40 dark:bg-slate-950 dark:bg-opacity-40 w-full backdrop-blur z-50 shadow-sm">
//       <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
//         {/* 왼쪽: 로고 + 토글 버튼 */}
//         <div className="flex items-center gap-2">
//           <Link to='/' className="flex gap-2 items-center group">
//             <p className="text-lg font-black group-hover:text-slate-500">UKTA</p>
//           </Link>
//           {/* 하나로 합친 토글 버튼 */}
//           <button
//             onClick={toggleLanguage}
//             className="
//               text-xs px-2 py-1 rounded
//               bg-slate-100 dark:bg-slate-800
//               hover:bg-slate-200 dark:hover:bg-slate-700
//               transition-all
//               font-medium
//             "
//           >
//             {language === 'ko' ? 'Eng' : '한국어'}
//           </button>
//         </div>

//         {/* 오른쪽: 네비게이션 메뉴 */}
//         <div className="whitespace-nowrap items-end flex text-sm *:px-2 divide-x-2 dark:divide-slate-700">
//           <Link to="/"
//             className={`
//               hover:text-slate-500
//               ${currentPage === "/" ? "font-bold" : "text-opacity-50"} 
//               transition-all ease-in-out
//             `}
//           >
//             {LABELS.home[language]}
//           </Link>
//           <Link to="/analysis"
//             className={`
//               hover:text-slate-500
//               ${currentPage === "/analysis" ? "font-bold" : "text-opacity-50"} 
//               transition-all ease-in-out
//             `}
//           >
//             {LABELS.analysis[language]}
//           </Link>


//           {/* ✅ 새 피드백 메뉴*/}
//           <Link to="/feedback"
//             className={`
//               hover:text-slate-500
//               ${currentPage === "/feedback" ? "font-bold" : "text-opacity-50"} 
//               transition-all ease-in-out
//             `}
//           >
//             {LABELS.feedback[language]}
//           </Link>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Nav;
