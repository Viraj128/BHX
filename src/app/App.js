// import { BrowserRouter as Router } from "react-router-dom";
// import { AuthProvider } from './context/AuthContext';
// import AppRoutes from './AppRoutes';

// function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <AppRoutes />
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;


// src/app/App.js
// import { BrowserRouter as Router } from "react-router-dom";
// import { AuthProvider } from '../../auth/context/AuthContext'; // Go up one level, then into auth/context
// import AppRoutes from './AppRoutes';

// function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <AppRoutes />
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;


// src/app/App.js
// import { BrowserRouter as Router } from "react-router-dom";
// import { AuthProvider } from '../auth/context/AuthContext'; // Relative to src/app/
// import AppRoutes from './AppRoutes';

// function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <AppRoutes />
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;




// src/app/App.js
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from '../auth/context/AuthContext';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;