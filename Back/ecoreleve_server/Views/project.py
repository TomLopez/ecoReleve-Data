from ..Models import (
    Project,
    ProjectList
)
from sqlalchemy import select, desc, join, outerjoin
from collections import OrderedDict
from sqlalchemy.exc import IntegrityError
from ..controllers.security import context_permissions
from ..GenericObjets.ObjectView import DynamicObjectView, DynamicObjectCollectionView
from ..controllers.ApiController import RootCore


class ProjectView(DynamicObjectView):

    model = Project


class ProjectsView(DynamicObjectCollectionView):

    Collection = ProjectList
    item = ProjectView
    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        # self.actions = {'updateSiteLocation': self.updateMonitoredSite,
        #                 'importGPX': self.getFormImportGPX,
        #                 'fieldActivity': self.getFieldActivityList
        #                 }
        self.__acl__ = context_permissions[ref]


RootCore.listChildren.append(('projects', ProjectsView))