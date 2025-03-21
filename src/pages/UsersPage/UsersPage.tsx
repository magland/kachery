import { useContext, useEffect } from 'react';
import { LoginContext } from '../../LoginContext/LoginContext';
import useRoute from '../../useRoute';
import { useUsers } from '../../hooks';

const UsersPage = () => {
    const loginContext = useContext(LoginContext);
    const { setRoute } = useRoute();
    const { users } = useUsers();

    // Redirect non-admin users
    useEffect(() => {
        if (loginContext?.userId !== 'github|magland') {
            setRoute({ page: 'home' });
        }
    }, [loginContext?.userId, setRoute]);

    if (loginContext?.userId !== 'github|magland') {
        return null; // Prevent flash of content during redirect
    }

    if (!users) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Users</h1>
            <table className="scientific-table">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Research Description</th>
                        <th>API Key Status</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr 
                            key={user.userId}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setRoute({ page: 'user', userId: user.userId })}
                        >
                            <td>{user.userId}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.researchDescription}</td>
                            <td>{user.apiKey ? 'Set' : 'Not set'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UsersPage;
